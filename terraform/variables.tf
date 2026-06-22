variable "aws_region" {
  description = "AWS region for all resources. us-east-1 keeps a future ACM cert option open."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name prefix for all resources."
  type        = string
  default     = "liftlog"
}

variable "github_repo" {
  description = "GitHub repo (owner/name) allowed to assume the CI role via OIDC."
  type        = string
  default     = "hatimpiplodwala/LiftLog"
}

variable "github_branch" {
  description = "Branch allowed to assume the CI role."
  type        = string
  default     = "main"
}

variable "create_oidc_provider" {
  description = "Create the GitHub OIDC provider. Set false if one already exists in the account."
  type        = bool
  default     = true
}
