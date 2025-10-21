# Recipes

Recipes allow you to save job configurations for easy reuse when running jobs on Recon.

**Video Tutorial:** [Recipes](https://www.youtube.com/watch?v=3lByqfsxQWg) (2min)

## Creating A Recipe

To create a recipe, you can use the _Recipes_ page. 

![Create Recipe](../images/using_recon/create_recipe.png)

1. First you need to select the tool you want to create the recipe for (Echidna, Medusa, Foundry, Halmos, or Kontrol). 

2. Next you need to enter a name for your recipe. 

3. You can add the URL of the repo you want to create the recipe for which will autofill the Organization, Repo, and Branch fields or if you prefer, you can manually fill in these fields. 

4. Next you can add the fuzzing configuration for the recipe which will override the configurations in the config file for the tool. 

5. If your project uses a dependency system in addition to foundry, you can select the custom preinstall process in the dropdown menu. 

6. Once you've filled in all the fields, you can click the _Create Recipe_ button to save the recipe. 

Your recipe will then appear in the list of recipes at the bottom of the page. Recipes can be edited (using the _Edit this Recipe_ button) or deleted (using the _Delete this Recipe_ button) at any time. 

## Using A Recipe

![Recipes](../images/using_recon/recipes.png)

To use a recipe, you can select the recipe from the list of recipes at the top of the _Jobs_ page. This will prefill all the form fields for the job configuration and you can then edit any of the values as needed. The job can then be run as normal using the _Run Job_ button.

## Recipe Use Cases

Recipes serve three main purposes:

1. **Quick Presets**: Use recipes as templates on the Jobs page to quickly run common configurations without re-entering all parameters
2. **Campaign Templates**: Link recipes to [campaigns](./campaigns.md) for automated CI/CD fuzzing on PR pushes and commits
3. **Alert Management**: Attach [alerts](./alerts.md) to recipes to receive notifications when broken properties are found

## Managing Recipes

All your recipes appear at the bottom of the Recipes page where you can:
- **Edit** recipes using the "Edit this Recipe" button to update configurations
- **Delete** recipes using the "Delete this Recipe" button when no longer needed
- **View** recipe details including tool type, repository, and configuration parameters

> **Note**: Changes to a recipe automatically apply to any campaigns using that recipe. 