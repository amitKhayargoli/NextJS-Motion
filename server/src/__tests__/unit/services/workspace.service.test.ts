import { WorkspaceService } from "src/services/workspace.service";
import {
  WorkspaceResponseDTO,
  WorkspaceWithRoleDTO,
  WorkspaceMemberDTO,
  AccessRequestDTO,
} from "src/dtos/workspace.dto";

jest.mock("src/dtos/validators/workspace.validator", () => ({
  WorkspaceValidator: {
    validateCreateWorkspace: jest
      .fn()
      .mockReturnValue({ isValid: true, errors: [] }),
    validateUpdateWorkspace: jest
      .fn()
      .mockReturnValue({ isValid: true, errors: [] }),
    validateAddMember: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    validateUpdateMemberRole: jest
      .fn()
      .mockReturnValue({ isValid: true, errors: [] }),
  },
}));

import { WorkspaceValidator } from "src/dtos/validators/workspace.validator";

describe("WorkspaceService", () => {
  let workspaceService: WorkspaceService;
  let mockWorkspaceRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByOwnerId: jest.Mock;
    findByUserId: jest.Mock;
    findByInviteLink: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
    addMember: jest.Mock;
    removeMember: jest.Mock;
    updateMemberRole: jest.Mock;
    getMembers: jest.Mock;
    isMember: jest.Mock;
    getUserRole: jest.Mock;
    joinWithInviteLink: jest.Mock;
    requestEditAccess: jest.Mock;
    approveEditAccess: jest.Mock;
    denyEditAccess: jest.Mock;
    getPendingRequests: jest.Mock;
    getMyAccessRequest: jest.Mock;
    cancelUserAccessRequests: jest.Mock;
    approveUserAccessRequests: jest.Mock;
  };

  const mockWorkspace = {
    id: "ws-1",
    name: "Test Workspace",
    inviteLink: "abc123",
    ownerId: "owner-1",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockWorkspaceRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOwnerId: jest.fn(),
      findByUserId: jest.fn(),
      findByInviteLink: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
      updateMemberRole: jest.fn(),
      getMembers: jest.fn(),
      isMember: jest.fn(),
      getUserRole: jest.fn(),
      joinWithInviteLink: jest.fn(),
      requestEditAccess: jest.fn(),
      approveEditAccess: jest.fn(),
      denyEditAccess: jest.fn(),
      getPendingRequests: jest.fn(),
      getMyAccessRequest: jest.fn(),
      cancelUserAccessRequests: jest.fn(),
      approveUserAccessRequests: jest.fn(),
    };

    workspaceService = new WorkspaceService(mockWorkspaceRepository as any);
  });

  describe("createWorkspace", () => {
    it("should create a workspace and return WorkspaceResponseDTO", async () => {
      mockWorkspaceRepository.create.mockResolvedValue(mockWorkspace);

      const dto = { name: "Test Workspace", ownerId: "owner-1" };
      const result = await workspaceService.createWorkspace(dto as any);

      expect(WorkspaceValidator.validateCreateWorkspace).toHaveBeenCalledWith(
        dto,
      );
      expect(mockWorkspaceRepository.create).toHaveBeenCalledWith({
        name: "Test Workspace",
        ownerId: "owner-1",
      });
      expect(result).toBeInstanceOf(WorkspaceResponseDTO);
      expect(result.id).toBe("ws-1");
    });

    it("should throw if validation fails", async () => {
      (
        WorkspaceValidator.validateCreateWorkspace as jest.Mock
      ).mockReturnValueOnce({
        isValid: false,
        errors: ["name is required"],
      });

      const dto = { name: "", ownerId: "owner-1" };

      await expect(
        workspaceService.createWorkspace(dto as any),
      ).rejects.toThrow("Validation failed: name is required");
      expect(mockWorkspaceRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("updateWorkspace", () => {
    it("should update a workspace and return WorkspaceResponseDTO", async () => {
      const updatedWorkspace = { ...mockWorkspace, name: "Updated Name" };
      mockWorkspaceRepository.exists.mockResolvedValue(true);
      mockWorkspaceRepository.update.mockResolvedValue(updatedWorkspace);

      const dto = { workspaceId: "ws-1", name: "Updated Name" };
      const result = await workspaceService.updateWorkspace(dto as any);

      expect(WorkspaceValidator.validateUpdateWorkspace).toHaveBeenCalledWith(
        dto,
      );
      expect(mockWorkspaceRepository.exists).toHaveBeenCalledWith("ws-1");
      expect(mockWorkspaceRepository.update).toHaveBeenCalledWith("ws-1", {
        name: "Updated Name",
      });
      expect(result).toBeInstanceOf(WorkspaceResponseDTO);
      expect(result.name).toBe("Updated Name");
    });

    it("should throw 'Workspace not found' if workspace does not exist", async () => {
      mockWorkspaceRepository.exists.mockResolvedValue(false);

      const dto = { workspaceId: "nonexistent", name: "X" };

      await expect(
        workspaceService.updateWorkspace(dto as any),
      ).rejects.toThrow("Workspace not found");
    });

    it("should throw if validation fails", async () => {
      (
        WorkspaceValidator.validateUpdateWorkspace as jest.Mock
      ).mockReturnValueOnce({
        isValid: false,
        errors: ["name too short"],
      });

      const dto = { workspaceId: "ws-1", name: "X" };

      await expect(
        workspaceService.updateWorkspace(dto as any),
      ).rejects.toThrow("Validation failed: name too short");
    });
  });

  describe("getWorkspaceById", () => {
    it("should return WorkspaceResponseDTO for an existing workspace", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);

      const result = await workspaceService.getWorkspaceById("ws-1");

      expect(mockWorkspaceRepository.findById).toHaveBeenCalledWith("ws-1");
      expect(result).toBeInstanceOf(WorkspaceResponseDTO);
      expect(result.id).toBe("ws-1");
    });

    it("should throw 'Workspace not found' if workspace does not exist", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(null);

      await expect(
        workspaceService.getWorkspaceById("nonexistent"),
      ).rejects.toThrow("Workspace not found");
    });
  });

  describe("getUserWorkspaces", () => {
    it("should return WorkspaceWithRoleDTO array", async () => {
      const workspacesWithRole = [
        { ...mockWorkspace, userRole: "OWNER" },
        { ...mockWorkspace, id: "ws-2", name: "Second", userRole: "EDITOR" },
      ];
      mockWorkspaceRepository.findByUserId.mockResolvedValue(
        workspacesWithRole,
      );

      const result = await workspaceService.getUserWorkspaces("owner-1");

      expect(mockWorkspaceRepository.findByUserId).toHaveBeenCalledWith(
        "owner-1",
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(WorkspaceWithRoleDTO);
    });
  });

  describe("getOwnedWorkspaces", () => {
    it("should return WorkspaceResponseDTO array", async () => {
      mockWorkspaceRepository.findByOwnerId.mockResolvedValue([mockWorkspace]);

      const result = await workspaceService.getOwnedWorkspaces("owner-1");

      expect(mockWorkspaceRepository.findByOwnerId).toHaveBeenCalledWith(
        "owner-1",
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(WorkspaceResponseDTO);
    });
  });

  describe("deleteWorkspace", () => {
    it("should delete a workspace when requester is the owner", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);
      mockWorkspaceRepository.delete.mockResolvedValue(undefined);

      await workspaceService.deleteWorkspace("ws-1", "owner-1");

      expect(mockWorkspaceRepository.findById).toHaveBeenCalledWith("ws-1");
      expect(mockWorkspaceRepository.delete).toHaveBeenCalledWith("ws-1");
    });

    it("should throw 'Workspace not found' if workspace does not exist", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(null);

      await expect(
        workspaceService.deleteWorkspace("nonexistent", "owner-1"),
      ).rejects.toThrow("Workspace not found");
    });

    it("should throw if non-owner tries to delete", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);

      await expect(
        workspaceService.deleteWorkspace("ws-1", "other-user"),
      ).rejects.toThrow("Only workspace owner can delete the workspace");
      expect(mockWorkspaceRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("addMember", () => {
    it("should add a member successfully", async () => {
      mockWorkspaceRepository.exists.mockResolvedValue(true);
      mockWorkspaceRepository.isMember.mockResolvedValue(false);
      mockWorkspaceRepository.addMember.mockResolvedValue(undefined);

      const dto = { workspaceId: "ws-1", userId: "user-2", role: "EDITOR" };

      await workspaceService.addMember(dto as any);

      expect(WorkspaceValidator.validateAddMember).toHaveBeenCalledWith(dto);
      expect(mockWorkspaceRepository.exists).toHaveBeenCalledWith("ws-1");
      expect(mockWorkspaceRepository.isMember).toHaveBeenCalledWith(
        "ws-1",
        "user-2",
      );
      expect(mockWorkspaceRepository.addMember).toHaveBeenCalledWith(
        "ws-1",
        "user-2",
        "EDITOR",
      );
    });

    it("should throw 'Workspace not found' if workspace does not exist", async () => {
      mockWorkspaceRepository.exists.mockResolvedValue(false);

      const dto = {
        workspaceId: "nonexistent",
        userId: "user-2",
        role: "EDITOR",
      };

      await expect(workspaceService.addMember(dto as any)).rejects.toThrow(
        "Workspace not found",
      );
    });

    it("should throw if user is already a member", async () => {
      mockWorkspaceRepository.exists.mockResolvedValue(true);
      mockWorkspaceRepository.isMember.mockResolvedValue(true);

      const dto = { workspaceId: "ws-1", userId: "user-2", role: "EDITOR" };

      await expect(workspaceService.addMember(dto as any)).rejects.toThrow(
        "User is already a member of this workspace",
      );
    });
  });

  describe("removeMember", () => {
    it("should remove a member successfully when requester is owner", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);
      mockWorkspaceRepository.getUserRole.mockResolvedValue("OWNER");
      mockWorkspaceRepository.removeMember.mockResolvedValue(undefined);

      await workspaceService.removeMember("ws-1", "user-2", "owner-1");

      expect(mockWorkspaceRepository.findById).toHaveBeenCalledWith("ws-1");
      expect(mockWorkspaceRepository.getUserRole).toHaveBeenCalledWith(
        "ws-1",
        "owner-1",
      );
      expect(mockWorkspaceRepository.removeMember).toHaveBeenCalledWith(
        "ws-1",
        "user-2",
      );
    });

    it("should throw if trying to remove the owner", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);

      await expect(
        workspaceService.removeMember("ws-1", "owner-1", "owner-1"),
      ).rejects.toThrow("Cannot remove workspace owner");
      expect(mockWorkspaceRepository.removeMember).not.toHaveBeenCalled();
    });

    it("should throw if requester is not the owner", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);
      mockWorkspaceRepository.getUserRole.mockResolvedValue("EDITOR");

      await expect(
        workspaceService.removeMember("ws-1", "user-2", "editor-1"),
      ).rejects.toThrow("Only workspace owner can remove members");
      expect(mockWorkspaceRepository.removeMember).not.toHaveBeenCalled();
    });
  });

  describe("updateMemberRole", () => {
    it("should upgrade member to EDITOR and approve access requests", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);
      mockWorkspaceRepository.updateMemberRole.mockResolvedValue(undefined);
      mockWorkspaceRepository.approveUserAccessRequests.mockResolvedValue(
        undefined,
      );

      const dto = { workspaceId: "ws-1", userId: "user-2", role: "EDITOR" };

      await workspaceService.updateMemberRole(dto as any, "owner-1");

      expect(WorkspaceValidator.validateUpdateMemberRole).toHaveBeenCalledWith(
        dto,
      );
      expect(mockWorkspaceRepository.updateMemberRole).toHaveBeenCalledWith(
        "ws-1",
        "user-2",
        "EDITOR",
      );
      expect(
        mockWorkspaceRepository.approveUserAccessRequests,
      ).toHaveBeenCalledWith("ws-1", "user-2");
    });

    it("should downgrade member to VIEWER and cancel access requests", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);
      mockWorkspaceRepository.updateMemberRole.mockResolvedValue(undefined);
      mockWorkspaceRepository.cancelUserAccessRequests.mockResolvedValue(
        undefined,
      );

      const dto = { workspaceId: "ws-1", userId: "user-2", role: "VIEWER" };

      await workspaceService.updateMemberRole(dto as any, "owner-1");

      expect(mockWorkspaceRepository.updateMemberRole).toHaveBeenCalledWith(
        "ws-1",
        "user-2",
        "VIEWER",
      );
      expect(
        mockWorkspaceRepository.cancelUserAccessRequests,
      ).toHaveBeenCalledWith("ws-1", "user-2");
    });

    it("should throw if trying to change owner role", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);

      const dto = { workspaceId: "ws-1", userId: "owner-1", role: "EDITOR" };

      await expect(
        workspaceService.updateMemberRole(dto as any, "owner-1"),
      ).rejects.toThrow("Cannot change owner role");
      expect(mockWorkspaceRepository.updateMemberRole).not.toHaveBeenCalled();
    });
  });

  describe("getWorkspaceMembers", () => {
    it("should return WorkspaceMemberDTO array", async () => {
      const members = [
        {
          userId: "owner-1",
          workspaceId: "ws-1",
          role: "OWNER",
          user: { id: "owner-1", email: "o@o.com", username: "owner" },
        },
      ];
      mockWorkspaceRepository.exists.mockResolvedValue(true);
      mockWorkspaceRepository.getMembers.mockResolvedValue(members);

      const result = await workspaceService.getWorkspaceMembers("ws-1");

      expect(mockWorkspaceRepository.exists).toHaveBeenCalledWith("ws-1");
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(WorkspaceMemberDTO);
    });

    it("should throw 'Workspace not found' if workspace does not exist", async () => {
      mockWorkspaceRepository.exists.mockResolvedValue(false);

      await expect(
        workspaceService.getWorkspaceMembers("nonexistent"),
      ).rejects.toThrow("Workspace not found");
    });
  });

  describe("joinWorkspaceByInviteLink", () => {
    it("should join workspace as VIEWER by invite link", async () => {
      mockWorkspaceRepository.findByInviteLink.mockResolvedValue(mockWorkspace);
      mockWorkspaceRepository.isMember.mockResolvedValue(false);
      mockWorkspaceRepository.addMember.mockResolvedValue(undefined);

      const result = await workspaceService.joinWorkspaceByInviteLink(
        "abc123",
        "user-2",
      );

      expect(mockWorkspaceRepository.findByInviteLink).toHaveBeenCalledWith(
        "abc123",
      );
      expect(mockWorkspaceRepository.isMember).toHaveBeenCalledWith(
        "ws-1",
        "user-2",
      );
      expect(mockWorkspaceRepository.addMember).toHaveBeenCalledWith(
        "ws-1",
        "user-2",
        "VIEWER",
      );
      expect(result).toBeInstanceOf(WorkspaceResponseDTO);
    });

    it("should return workspace without adding if already a member", async () => {
      mockWorkspaceRepository.findByInviteLink.mockResolvedValue(mockWorkspace);
      mockWorkspaceRepository.isMember.mockResolvedValue(true);

      const result = await workspaceService.joinWorkspaceByInviteLink(
        "abc123",
        "owner-1",
      );

      expect(mockWorkspaceRepository.addMember).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(WorkspaceResponseDTO);
    });

    it("should throw 'Invalid Invite code' for bad invite link", async () => {
      mockWorkspaceRepository.findByInviteLink.mockResolvedValue(null);

      await expect(
        workspaceService.joinWorkspaceByInviteLink("bad-link", "user-2"),
      ).rejects.toThrow("Invalid Invite code");
    });
  });

  describe("regenerateInviteLink", () => {
    it("should regenerate invite link when requester is owner", async () => {
      const updatedWorkspace = { ...mockWorkspace, inviteLink: "newhex123" };
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);
      mockWorkspaceRepository.update.mockResolvedValue(updatedWorkspace);

      const result = await workspaceService.regenerateInviteLink(
        "ws-1",
        "owner-1",
      );

      expect(mockWorkspaceRepository.findById).toHaveBeenCalledWith("ws-1");
      expect(mockWorkspaceRepository.update).toHaveBeenCalledWith("ws-1", {
        inviteLink: expect.any(String),
      });
      expect(result).toBeInstanceOf(WorkspaceResponseDTO);
    });

    it("should throw if non-owner tries to regenerate", async () => {
      mockWorkspaceRepository.findById.mockResolvedValue(mockWorkspace);

      await expect(
        workspaceService.regenerateInviteLink("ws-1", "other-user"),
      ).rejects.toThrow("Only workspace owner can regenerate Invite code");
      expect(mockWorkspaceRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("requestEditAccess", () => {
    it("should request edit access for VIEWER", async () => {
      mockWorkspaceRepository.getUserRole.mockResolvedValue("VIEWER");
      mockWorkspaceRepository.requestEditAccess.mockResolvedValue(undefined);

      await workspaceService.requestEditAccess("ws-1", "viewer-1");

      expect(mockWorkspaceRepository.getUserRole).toHaveBeenCalledWith(
        "ws-1",
        "viewer-1",
      );
      expect(mockWorkspaceRepository.requestEditAccess).toHaveBeenCalledWith(
        "ws-1",
        "viewer-1",
      );
    });

    it("should throw if user is not a VIEWER", async () => {
      mockWorkspaceRepository.getUserRole.mockResolvedValue("EDITOR");

      await expect(
        workspaceService.requestEditAccess("ws-1", "editor-1"),
      ).rejects.toThrow("Only VIEWER members can request edit access");
    });

    it("should throw if user is not a member", async () => {
      mockWorkspaceRepository.getUserRole.mockResolvedValue(null);

      await expect(
        workspaceService.requestEditAccess("ws-1", "stranger"),
      ).rejects.toThrow("You are not a member of this workspace");
    });
  });

  describe("getPendingRequests", () => {
    it("should return AccessRequestDTO array", async () => {
      const requests = [
        {
          id: "req-1",
          workspaceId: "ws-1",
          userId: "user-2",
          status: "PENDING",
          createdAt: new Date("2025-01-01"),
          user: {
            id: "user-2",
            username: "user2",
            email: "u2@e.com",
            profilePicture: null,
          },
        },
      ];
      mockWorkspaceRepository.exists.mockResolvedValue(true);
      mockWorkspaceRepository.getPendingRequests.mockResolvedValue(requests);

      const result = await workspaceService.getPendingRequests("ws-1");

      expect(mockWorkspaceRepository.exists).toHaveBeenCalledWith("ws-1");
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(AccessRequestDTO);
    });

    it("should throw 'Workspace not found' if workspace does not exist", async () => {
      mockWorkspaceRepository.exists.mockResolvedValue(false);

      await expect(
        workspaceService.getPendingRequests("nonexistent"),
      ).rejects.toThrow("Workspace not found");
    });
  });

  describe("getMyAccessRequest", () => {
    it("should return AccessRequestDTO when request exists", async () => {
      const rawRequest = {
        id: "req-1",
        workspaceId: "ws-1",
        userId: "user-2",
        status: "PENDING",
        createdAt: new Date("2025-01-01"),
        user: {
          id: "user-2",
          username: "user2",
          email: "u2@e.com",
          profilePicture: null,
        },
      };
      mockWorkspaceRepository.getMyAccessRequest.mockResolvedValue(rawRequest);

      const result = await workspaceService.getMyAccessRequest(
        "ws-1",
        "user-2",
      );

      expect(mockWorkspaceRepository.getMyAccessRequest).toHaveBeenCalledWith(
        "ws-1",
        "user-2",
      );
      expect(result).toBeInstanceOf(AccessRequestDTO);
      expect(result!.id).toBe("req-1");
    });

    it("should return null when no request exists", async () => {
      mockWorkspaceRepository.getMyAccessRequest.mockResolvedValue(null);

      const result = await workspaceService.getMyAccessRequest(
        "ws-1",
        "user-2",
      );

      expect(result).toBeNull();
    });
  });
});
