import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
  AddMemberDTO,
  UpdateMemberRoleDTO,
} from "../workspace.dto";
import { WorkspaceRole } from "../../types/workspace.type";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class WorkspaceValidator {
  static validateCreateWorkspace(dto: CreateWorkspaceDTO): ValidationResult {
    const errors: string[] = [];

    if (!dto.name || dto.name.trim().length === 0) {
      errors.push("Workspace name is required");
    } else if (dto.name.length < 3) {
      errors.push("Workspace name must be at least 3 characters");
    } else if (dto.name.length > 100) {
      errors.push("Workspace name cannot exceed 100 characters");
    }

    if (!dto.ownerId || dto.ownerId.trim().length === 0) {
      errors.push("Owner ID is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateUpdateWorkspace(dto: UpdateWorkspaceDTO): ValidationResult {
    const errors: string[] = [];

    if (!dto.workspaceId || dto.workspaceId.trim().length === 0) {
      errors.push("Workspace ID is required");
    }

    if (!dto.name) {
      errors.push("Must provide at least one field to update");
    }

    if (dto.name !== undefined) {
      if (dto.name.trim().length === 0) {
        errors.push("Workspace name cannot be empty");
      } else if (dto.name.length < 3) {
        errors.push("Workspace name must be at least 3 characters");
      } else if (dto.name.length > 100) {
        errors.push("Workspace name cannot exceed 100 characters");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateAddMember(dto: AddMemberDTO): ValidationResult {
    const errors: string[] = [];

    if (!dto.workspaceId || dto.workspaceId.trim().length === 0) {
      errors.push("Workspace ID is required");
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      errors.push("User ID is required");
    }

    if (!Object.values(WorkspaceRole).includes(dto.role)) {
      errors.push("Invalid role");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateUpdateMemberRole(dto: UpdateMemberRoleDTO): ValidationResult {
    const errors: string[] = [];

    if (!dto.workspaceId || dto.workspaceId.trim().length === 0) {
      errors.push("Workspace ID is required");
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      errors.push("User ID is required");
    }

    if (!Object.values(WorkspaceRole).includes(dto.role)) {
      errors.push("Invalid role");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
