import { EmbedBuilder } from "discord.js"

export const AboutEmbed = () =>
  new EmbedBuilder()
    .setTitle("Patrol")
    .setURL("http://5f.au/patrol")
    .setDescription(
      "Automatically set a role to active members of your server staff, perfect for active moderator pings.\n\nGet started by using `/setmoderole` to set the normal moderator role (default), and the role you wish to give online moderators (active). Members with the normal moderator role who are either online or idle will be given the active role, until going DND or offline!\n\nCreated as part of [5f.au](https://discord.gg/deAfFeVY7u)."
    )
