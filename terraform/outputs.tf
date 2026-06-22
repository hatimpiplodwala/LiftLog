# Values to copy into the GitHub Actions repository variables (see deploy.yml).

output "cloudfront_url" {
  description = "Public HTTPS URL of the deployed app."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "Set as repo variable CLOUDFRONT_DISTRIBUTION_ID."
  value       = aws_cloudfront_distribution.site.id
}

output "ecr_repository_name" {
  description = "Set as repo variable ECR_REPOSITORY."
  value       = aws_ecr_repository.app.name
}

output "s3_bucket" {
  description = "Set as repo variable S3_BUCKET."
  value       = aws_s3_bucket.site.bucket
}

output "ci_role_arn" {
  description = "Set as repo variable AWS_ROLE_ARN."
  value       = aws_iam_role.ci.arn
}
