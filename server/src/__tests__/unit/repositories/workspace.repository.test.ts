import { createMockPrisma, MockPrismaClient } from "../mockPrisma";
import { WorkspaceRepository } from "src/repositories/workspace.repository";

describe("WorkspaceRepository", () => {
  let mockPrisma: MockPrismaClient;
  let repo: WorkspaceRepository;

  const now = new Date("2025-01-05");

  const mockPrismaWorkspace = {
    id: "ws-1",
    name: "Test Workspace",
    inviteLink: "abc123hex",
    ownerId: "user-1",
    createdAt: now,
    updatedAt: now,
  };

  const expectedIWorkspace = {
    id: "ws-1",
    name: "Test Workspace",
    inviteLink: "abc123hex",
    ownerId: "user-1",
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    repo = new WorkspaceRepository(mockPrisma as any);
  });

  describe("create", () => {
    it("should create a workspace with generated inviteLink and OWNER role", async () => {
      mockPrisma.workspace.create.mockResolvedValue(mockPrismaWorkspace);

      const result = await repo.create({
        name: "Test Workspace",
        ownerId: "user-1",
      });

      expect(mockPrisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: "Test Workspace",
          inviteLink: expect.any(String),
          ownerId: "user-1",
          UserRoles: {
            create: {
              userId: "user-1",
              role: "OWNER",
            },
          },
        },
      });
      expect(result).toEqual(expectedIWorkspace);
    });

    it("should generate a non-empty inviteLink", async () => {
      mockPrisma.workspace.create.mockResolvedValue(mockPrismaWorkspace);

      await repo.create({ name: "WS", ownerId: "user-1" });

      const callArg = mockPrisma.workspace.create.mock.calls[0][0];
      expect(callArg.data.inviteLink).toBeTruthy();
      expect(callArg.data.inviteLink.length).toBeGreaterThan(0);
    });
  });

  describe("findById", () => {
    it("should return workspace when found", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockPrismaWorkspace);

      const result = await repo.findById("ws-1");

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: "ws-1" },
      });
      expect(result).toEqual(expectedIWorkspace);
    });

    it("should return null when not found", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      const result = await repo.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByOwnerId", () => {
    it("should return workspaces ordered by createdAt desc", async () => {
      const workspaces = [
        mockPrismaWorkspace,
        { ...mockPrismaWorkspace, id: "ws-2" },
      ];
      mockPrisma.workspace.findMany.mockResolvedValue(workspaces);

      const result = await repo.findByOwnerId("user-1");

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(2);
    });

    it("should return empty array when owner has no workspaces", async () => {
      mockPrisma.workspace.findMany.mockResolvedValue([]);

      const result = await repo.findByOwnerId("user-none");

      expect(result).toEqual([]);
    });
  });

  describe("findByUserId", () => {
    it("should return workspaces with user roles", async () => {
      const userRoles = [
        { role: "OWNER", workspace: mockPrismaWorkspace },
        {
          role: "VIEWER",
          workspace: { ...mockPrismaWorkspace, id: "ws-2", name: "Other" },
        },
      ];
      mockPrisma.userRoles.findMany.mockResolvedValue(userRoles);

      const result = await repo.findByUserId("user-1");

      expect(mockPrisma.userRoles.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { workspace: true },
        orderBy: { workspace: { createdAt: "desc" } },
      });
      expect(result).toHaveLength(2);
      expect(result[0].userRole).toBe("OWNER");
      expect(result[1].userRole).toBe("VIEWER");
    });

    it("should return empty array when user has no workspaces", async () => {
      mockPrisma.userRoles.findMany.mockResolvedValue([]);

      const result = await repo.findByUserId("user-none");

      expect(result).toEqual([]);
    });
  });

  describe("findByInviteLink", () => {
    it("should return workspace when invite link matches", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockPrismaWorkspace);

      const result = await repo.findByInviteLink("abc123hex");

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { inviteLink: "abc123hex" },
      });
      expect(result).toEqual(expectedIWorkspace);
    });

    it("should return null when invite link is not found", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      const result = await repo.findByInviteLink("invalid-link");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update workspace name", async () => {
      const updated = { ...mockPrismaWorkspace, name: "Updated Name" };
      mockPrisma.workspace.update.mockResolvedValue(updated);

      const result = await repo.update("ws-1", { name: "Updated Name" });

      expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
        where: { id: "ws-1" },
        data: {
          name: "Updated Name",
          updatedAt: expect.any(Date),
        },
      });
      expect(result.name).toBe("Updated Name");
    });

    it("should update inviteLink", async () => {
      const updated = { ...mockPrismaWorkspace, inviteLink: "new-link" };
      mockPrisma.workspace.update.mockResolvedValue(updated);

      await repo.update("ws-1", { inviteLink: "new-link" });

      expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
        where: { id: "ws-1" },
        data: {
          inviteLink: "new-link",
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should not include name or inviteLink when not provided", async () => {
      mockPrisma.workspace.update.mockResolvedValue(mockPrismaWorkspace);

      await repo.update("ws-1", {});

      expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
        where: { id: "ws-1" },
        data: {
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe("delete", () => {
    it("should delete related records then workspace", async () => {
      mockPrisma.userRoles.deleteMany.mockResolvedValue({ count: 2 });
      (mockPrisma.note as any).deleteMany.mockResolvedValue({ count: 1 });
      (mockPrisma.task as any).deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.workspace.delete.mockResolvedValue(mockPrismaWorkspace);

      await repo.delete("ws-1");

      expect(mockPrisma.userRoles.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
      });
      expect((mockPrisma.note as any).deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
      });
      expect((mockPrisma.task as any).deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
      });
      expect(mockPrisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: "ws-1" },
      });
    });

    it("should call deletions in the correct order", async () => {
      const callOrder: string[] = [];
      mockPrisma.userRoles.deleteMany.mockImplementation(async () => {
        callOrder.push("userRoles");
        return { count: 0 };
      });
      (mockPrisma.note as any).deleteMany.mockImplementation(async () => {
        callOrder.push("notes");
        return { count: 0 };
      });
      (mockPrisma.task as any).deleteMany.mockImplementation(async () => {
        callOrder.push("tasks");
        return { count: 0 };
      });
      mockPrisma.workspace.delete.mockImplementation(async () => {
        callOrder.push("workspace");
        return mockPrismaWorkspace;
      });

      await repo.delete("ws-1");

      expect(callOrder).toEqual(["userRoles", "notes", "tasks", "workspace"]);
    });
  });

  describe("exists", () => {
    it("should return true when workspace exists", async () => {
      mockPrisma.workspace.count.mockResolvedValue(1);

      const result = await repo.exists("ws-1");

      expect(mockPrisma.workspace.count).toHaveBeenCalledWith({
        where: { id: "ws-1" },
      });
      expect(result).toBe(true);
    });

    it("should return false when workspace does not exist", async () => {
      mockPrisma.workspace.count.mockResolvedValue(0);

      const result = await repo.exists("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("addMember", () => {
    it("should create a user role entry", async () => {
      mockPrisma.userRoles.create.mockResolvedValue({});

      await repo.addMember("ws-1", "user-2", "EDITOR" as any);

      expect(mockPrisma.userRoles.create).toHaveBeenCalledWith({
        data: {
          workspaceId: "ws-1",
          userId: "user-2",
          role: "EDITOR",
        },
      });
    });
  });

  describe("removeMember", () => {
    it("should delete user role entries", async () => {
      mockPrisma.userRoles.deleteMany.mockResolvedValue({ count: 1 });

      await repo.removeMember("ws-1", "user-2");

      expect(mockPrisma.userRoles.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1", userId: "user-2" },
      });
    });
  });

  describe("updateMemberRole", () => {
    it("should update user role via updateMany", async () => {
      mockPrisma.userRoles.updateMany.mockResolvedValue({ count: 1 });

      await repo.updateMemberRole("ws-1", "user-2", "EDITOR" as any);

      expect(mockPrisma.userRoles.updateMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1", userId: "user-2" },
        data: { role: "EDITOR" },
      });
    });
  });

  describe("getMembers", () => {
    it("should return members with user info", async () => {
      const membersData = [
        {
          userId: "user-1",
          role: "OWNER",
          user: {
            id: "user-1",
            email: "a@b.com",
            username: "owner",
            profilePicture: null,
          },
        },
        {
          userId: "user-2",
          role: "VIEWER",
          user: {
            id: "user-2",
            email: "c@d.com",
            username: "viewer",
            profilePicture: null,
          },
        },
      ];
      mockPrisma.userRoles.findMany.mockResolvedValue(membersData);

      const result = await repo.getMembers("ws-1");

      expect(mockPrisma.userRoles.findMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              profilePicture: true,
            },
          },
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("OWNER");
      expect(result[0].workspaceId).toBe("ws-1");
      expect(result[1].userId).toBe("user-2");
    });

    it("should return empty array for workspace with no members", async () => {
      mockPrisma.userRoles.findMany.mockResolvedValue([]);

      const result = await repo.getMembers("ws-empty");

      expect(result).toEqual([]);
    });
  });

  describe("isMember", () => {
    it("should return true when user is a member", async () => {
      mockPrisma.userRoles.count.mockResolvedValue(1);

      const result = await repo.isMember("ws-1", "user-1");

      expect(mockPrisma.userRoles.count).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1", userId: "user-1" },
      });
      expect(result).toBe(true);
    });

    it("should return false when user is not a member", async () => {
      mockPrisma.userRoles.count.mockResolvedValue(0);

      const result = await repo.isMember("ws-1", "user-stranger");

      expect(result).toBe(false);
    });
  });

  describe("getUserRole", () => {
    it("should return role when user has a role", async () => {
      mockPrisma.userRoles.findFirst.mockResolvedValue({ role: "EDITOR" });

      const result = await repo.getUserRole("ws-1", "user-2");

      expect(mockPrisma.userRoles.findFirst).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1", userId: "user-2" },
      });
      expect(result).toBe("EDITOR");
    });

    it("should return null when user has no role", async () => {
      mockPrisma.userRoles.findFirst.mockResolvedValue(null);

      const result = await repo.getUserRole("ws-1", "user-none");

      expect(result).toBeNull();
    });
  });

  describe("requestEditAccess", () => {
    it("should upsert an access request with PENDING status", async () => {
      mockPrisma.accessRequest.upsert.mockResolvedValue({});

      await repo.requestEditAccess("ws-1", "user-2");

      expect(mockPrisma.accessRequest.upsert).toHaveBeenCalledWith({
        where: {
          unique_workspace_user_request: {
            workspaceId: "ws-1",
            userId: "user-2",
          },
        },
        create: { workspaceId: "ws-1", userId: "user-2", status: "PENDING" },
        update: { status: "PENDING" },
      });
    });
  });

  describe("approveEditAccess", () => {
    it("should upgrade role to EDITOR and mark request APPROVED", async () => {
      const request = {
        id: "req-1",
        workspaceId: "ws-1",
        userId: "user-2",
        status: "PENDING",
      };
      mockPrisma.accessRequest.findUnique.mockResolvedValue(request);
      mockPrisma.userRoles.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.accessRequest.update.mockResolvedValue({});

      await repo.approveEditAccess("req-1");

      expect(mockPrisma.accessRequest.findUnique).toHaveBeenCalledWith({
        where: { id: "req-1" },
      });
      expect(mockPrisma.userRoles.updateMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1", userId: "user-2" },
        data: { role: "EDITOR" },
      });
      expect(mockPrisma.accessRequest.update).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: { status: "APPROVED" },
      });
    });

    it("should do nothing when request is not found", async () => {
      mockPrisma.accessRequest.findUnique.mockResolvedValue(null);

      await repo.approveEditAccess("req-invalid");

      expect(mockPrisma.userRoles.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.accessRequest.update).not.toHaveBeenCalled();
    });

    it("should do nothing when request is not PENDING", async () => {
      const request = {
        id: "req-1",
        workspaceId: "ws-1",
        userId: "user-2",
        status: "APPROVED",
      };
      mockPrisma.accessRequest.findUnique.mockResolvedValue(request);

      await repo.approveEditAccess("req-1");

      expect(mockPrisma.userRoles.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("denyEditAccess", () => {
    it("should update access request status to DENIED", async () => {
      mockPrisma.accessRequest.update.mockResolvedValue({});

      await repo.denyEditAccess("req-1");

      expect(mockPrisma.accessRequest.update).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: { status: "DENIED" },
      });
    });
  });

  describe("joinWithInviteLink", () => {
    it("should add user as VIEWER when not already a member", async () => {
      mockPrisma.userRoles.count.mockResolvedValue(0);
      mockPrisma.userRoles.create.mockResolvedValue({});

      await repo.joinWithInviteLink("ws-1", "user-new");

      expect(mockPrisma.userRoles.count).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1", userId: "user-new" },
      });
      expect(mockPrisma.userRoles.create).toHaveBeenCalledWith({
        data: { workspaceId: "ws-1", userId: "user-new", role: "VIEWER" },
      });
    });

    it("should not add user when already a member", async () => {
      mockPrisma.userRoles.count.mockResolvedValue(1);

      await repo.joinWithInviteLink("ws-1", "user-existing");

      expect(mockPrisma.userRoles.create).not.toHaveBeenCalled();
    });
  });
});
