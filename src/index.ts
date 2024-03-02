import { Client } from "discord.js"
import dotenv from "dotenv"
import embed from "./embed"

dotenv.config()

const client: Client<true> = new Client({ intents: ["GuildPresences"] })

// TODO: Handle guild events to keep track of servers the bot is being used

// Handle presence updates
client.on("presenceUpdate", async (_, newPresence) => {
  const user = client.users.cache.get(newPresence.userId) ?? (await client.users.fetch(newPresence.userId))
  if (user.bot) return

  // TODO: Get roles from database for each server the user is a mod
  const servers = [
    {
      guildId: "1206844029040332850",
      defaultRoleId: "1211245429635686510",
      activeRoleId: "1213362203370197022"
    }
  ]

  // Ignore presences of regular users
  for (const { guildId, defaultRoleId, activeRoleId } of servers) {
    const guild = await client.guilds.fetch(guildId)
    const member = await guild.members.fetch(user.id)
    if (!member.roles.cache.has(defaultRoleId)) continue

    const status = newPresence.status

    // Remove active role if user is offline
    if ((status === "offline" || status === "dnd") && member.roles.cache.has(activeRoleId))
      member.roles.remove(activeRoleId)

    // Add active role if user is online
    if ((status === "online" || status === "idle") && !member.roles.cache.has(activeRoleId))
      member.roles.add(activeRoleId)
  }
})

// Handle slash commands
client.on("interactionCreate", async interaction => {
  if (interaction.user.bot || !interaction.isChatInputCommand()) return
  if (interaction.commandName !== "setmodrole") return

  const role = interaction.options.getRole("role", true)
  const command = interaction.options.getSubcommand()

  if (command === "active") {
    const clientMember = await interaction.guild!.members.fetch(client.user.id)

    // TODO: Resolve .highest.position not working
    if (clientMember.roles.highest.position <= role.position) {
      interaction
        .reply({
          embeds: [
            embed(
              `I can't assign <@&${role.id}> as the active role as it is higher than my highest role. Please move my managed role above it so I can apply it to moderators.`
            )
          ],
          ephemeral: true
        })
        .catch(console.error)
      return
    }
  }

  // TODO: Save to database

  interaction
    .reply({ embeds: [embed(`Successfully set <@&${role.id}> as the ${command} mod role!`)], ephemeral: true })
    .catch(console.error)
})

// Login bot
client.once("ready", () => console.log(`Logged in as ${client.user.username}`))
client.login(process.env.TOKEN)
