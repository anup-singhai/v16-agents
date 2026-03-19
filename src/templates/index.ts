/**
 * Built-in Agent Templates
 * Pre-built agent prompts that ship with the local agent.
 * These are synced to the V16 dashboard when the agent connects.
 */

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  cliTool: string;
  defaultSchedule: string;
  prerequisites: string[];
  promptTemplate: string;
  guide: string;
}

const templates: AgentTemplate[] = [
  {
    id: 'cloudwatch-logs',
    name: 'CloudWatch Log Monitor',
    description:
      'Monitors AWS CloudWatch log groups for errors, anomalies, and critical patterns. Produces structured health reports.',
    category: 'devops',
    icon: 'CloudLightning',
    cliTool: 'claude',
    defaultSchedule: '0 * * * *',
    prerequisites: [
      'Claude Code installed',
      'AWS CLI configured with credentials',
    ],
    guide: `## AWS Profile Setup

This agent uses the AWS CLI to fetch CloudWatch logs. You need a configured AWS profile with the right permissions.

### 1. Install AWS CLI

\`\`\`bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
\`\`\`

### 2. Configure a Named Profile

\`\`\`bash
aws configure --profile <YOUR_PROFILE>
# Enter your Access Key ID, Secret Access Key, region, and output format
\`\`\`

### 3. Required IAM Permissions

Your profile needs these CloudWatch Logs permissions:
- \`logs:FilterLogEvents\`
- \`logs:DescribeLogGroups\`

Minimal IAM policy:
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["logs:FilterLogEvents", "logs:DescribeLogGroups"],
    "Resource": "arn:aws:logs:*:*:log-group:*"
  }]
}
\`\`\`

### 4. Update the Prompt

Replace \`<AWS_PROFILE>\`, \`<LOG_GROUP>\`, and \`<REGION>\` in the prompt with your actual values. For example:
- AWS Profile: \`production\`
- Log Group: \`/aws/lambda/my-api\`
- Region: \`us-east-1\`

### 5. Verify

\`\`\`bash
aws logs describe-log-groups --profile <YOUR_PROFILE> --region <REGION>
\`\`\`

If this returns your log groups, you're ready to deploy.`,
    promptTemplate: `Use the AWS CLI with the profile "<AWS_PROFILE>" to fetch recent CloudWatch logs from the log group "<LOG_GROUP>" in region "<REGION>".

Run this command:

aws logs filter-log-events --profile "<AWS_PROFILE>" --log-group-name "<LOG_GROUP>" --region "<REGION>" --start-time $(date -d '15 minutes ago' +%s000 2>/dev/null || date -v-15M +%s000) --limit 200

Analyze the log output. Do not use simple keyword matching. Think deeply about:
- Error patterns and their likely root causes
- Frequency and clustering of issues
- Severity levels and business impact
- Anomalies compared to expected behavior
- Cascading failures or correlated errors

Then output your report in exactly this format:

STATUS: HEALTHY | WARNING | CRITICAL

SUMMARY:
[1-2 sentence overview of the log group health]

FINDINGS:
- [Finding 1 with context and severity]
- [Finding 2 with context and severity]

METRICS:
- Total events analyzed: [count]
- Error events: [count]
- Warning events: [count]
- Time window: last 15 minutes

RECOMMENDATION:
[What action, if any, should be taken]

Rules:
- HEALTHY: No errors, normal operation
- WARNING: Non-critical errors or unusual patterns
- CRITICAL: Service-impacting errors, high error rates, or cascading failures
- If the AWS CLI command fails (wrong profile, missing permissions, bad region), report STATUS: CRITICAL with the error details`,
  },
];

/**
 * Get all built-in templates
 */
export function getBuiltInTemplates(): AgentTemplate[] {
  return templates;
}

/**
 * Get a built-in template by ID
 */
export function getBuiltInTemplate(id: string): AgentTemplate | undefined {
  return templates.find((t) => t.id === id);
}
