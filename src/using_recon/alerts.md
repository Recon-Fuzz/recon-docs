# Alerts

Alerts allow you to receive notifications when properties break during one of your runs to allow you to quickly take action. They can be added to any [recipe](/recipes.html) and specify whether an alert should trigger a Webhook or send a message on Telegram.

**Video Tutorial:** [Alerts](https://www.youtube.com/watch?v=xMRdHU4uH8M) (2min)

## Creating, Updating, and Viewing Alerts

Navigate to a Recipe

![Manage Alerts](../images/alerts/manage-alerts.png)
Click the _Manage Alerts_ button on the top right which will redirected you to a page that allows you to create and modify alerts for a given recipe.

![Recipe Alert Management](../images/using_recon/modify_alerts.png)

Scrolling down and clicking the _Manage Alerts_ button displays all existing alerts attached to this Recipe and allows creating new alerts.

![Create Alerts](../images/using_recon/manage_alerts.png)

Each alert requires specifying a threshold which is the number of properties that will trigger the alert.

## Telegram Alerts 

For Telegram alerts, you simply have to specify your Telegram username in the form field.

Before creating a Telegram alert you must click the `Test Connection` button which will send a message to our Telegram Bot: `@GetRecon_bot`. Always confirm the ID of the bot and message us on [discord](https://discord.gg/aCZrCBZdFd) if you have any questions.

![Add Telegram](../images/using_recon/add_telegram.png)

## Webhook Alerts

For webhooks, you can provide any URL:

![Add Webhook](../images/using_recon/add_webhook.png)

Which will be sent the following payload to it once an alert is triggered:

```typescript
{
  alerted: string,
  jobId: string,
  broken property: string,
  sequence: string
}
```

## Modifying Alerts
Once you have an existing alert you can delete, disable, or edit it on the right hand side:

![Change Alerts](../images/using_recon/change_alert.png)