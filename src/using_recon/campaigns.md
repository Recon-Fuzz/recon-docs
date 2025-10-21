# Campaigns

Campaigns are CI/CD automations that automatically run fuzzing jobs when code changes are pushed to your repository.

Each campaign is tied to an Organization, Repository and Branch and requires a [recipe](./recipes.md)

**Video Tutorial:** [Campaigns](https://www.youtube.com/watch?v=YFkwtb-RFyU) (3min)

## How Campaigns Work

Campaigns automatically trigger fuzzing jobs in two scenarios:
1. **Pull Request Creation**: When a new PR is opened from your configured branch
2. **Pull Request Push**: When new commits are pushed to an existing PR

When triggered, the campaign:
- Uses the recipe you configured as a template
- Overrides the Organization, Repository, and Branch fields with values from the PR
- Runs a fuzzing job using the recipe's configuration
- Posts comments on the PR with job status and results
- Triggers any [alerts](./alerts.md) attached to the recipe if broken properties are found

By default campaigns will leave a comment on the PR that triggered them.

![Campaign leaving a comment on start](../images/using_recon/campaign_start_comment.png)

They will also print a summary of the run, with a findings table and foundry repros for each broken property

![Campaign leaving a comment on end](../images/using_recon/campaign_end_comment.png)

## Creating a Campaign

Creating a campaign requires having [created a recipe first](./recipes.md)

To create a campaign:

1. Navigate to the Campaigns page
2. Select a recipe from the dropdown
3. Enter the **branch** name that you will be creating PRs from (e.g., if you're working on `dev` and pushing to `main`, write `dev` in the branch field)
4. The Organization and Repository are inherited from the recipe
5. Click create to activate the campaign

![Creating a campaign](../images/using_recon/campaign_setup_form.png)

## Managing Campaigns

Once created, scroll down to view all your campaigns. For each campaign you can:

![Updating a campaign](../images/using_recon/campaign_config.png)

- **Pause/Resume**: Temporarily disable the campaign without deleting it
- **Manage Alerts**: Configure [alerts](./alerts.md) for when properties break
- **Delete**: Permanently remove the campaign

> **Important**: Campaigns cannot be edited directly. However, any changes made to the underlying recipe will automatically apply to all campaigns using that recipe. This allows you to update configurations for multiple campaigns at once by editing a single recipe.
