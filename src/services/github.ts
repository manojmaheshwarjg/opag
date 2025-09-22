
import { Octokit } from "@octokit/rest";

type CreateIssueParams = {
    apiKey: string;
    owner: string;
    repo: string;
    title: string;
    body?: string;
}

export const createIssue = async ({ apiKey, owner, repo, title, body }: CreateIssueParams) => {
    const octokit = new Octokit({ auth: apiKey });

    const response = await octokit.issues.create({
        owner,
        repo,
        title,
        body,
    });

    return response.data;
}
