import { Client } from "discord.js"
import dotenv from "dotenv"
import embed from "./embed"
import { PrismaClient } from "@prisma/client"

dotenv.config()

const prisma = new PrismaClient()

const client: Client<true> = new Client({ intents: ["Guilds", "GuildMembers", "GuildModeration", "GuildPresences"] })

// Add/remove moderator from members who gain/lose the mod role
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const guild = await prisma.guild.findFirst({ where: { id: newMember.guild.id } })
  if (!guild || !guild.roleDefault) return

  // Remove mod role where applicable
  if (oldMember.roles.cache.has(guild.roleDefault) && !newMember.roles.cache.has(guild.roleDefault)) {
    await prisma.moderatorGuild.delete({
      where: { moderatorId_guildId: { guildId: newMember.guild.id, moderatorId: newMember.id } }
    })

    console.log(`Removed mod role from user ${newMember.user.id} in guild ${guild.id}`)
  }

  // Add mod role where applicable
  if (!oldMember.roles.cache.has(guild.roleDefault) && newMember.roles.cache.has(guild.roleDefault)) {
    await prisma.moderatorGuild.upsert({
      where: { moderatorId_guildId: { guildId: newMember.guild.id, moderatorId: newMember.id } },
      create: { guildId: newMember.guild.id, moderatorId: newMember.id },
      update: { guildId: newMember.guild.id, moderatorId: newMember.id }
    })

    console.log(`Added mod role to user ${newMember.user.id} in guild ${guild.id}`)
  }
})

// Remove moderator from members who leave the server
client.on("guildMemberRemove", async member => {
  const guild = await prisma.guild.findFirst({ where: { id: member.guild.id } })
  if (!guild || !guild.roleDefault) return

  if (member.roles.cache.has(guild.roleDefault)) {
    await prisma.moderatorGuild.delete({
      where: { moderatorId_guildId: { guildId: member.guild.id, moderatorId: member.id } }
    })

    console.log(`Removed mod role from user ${member.user.id} in guild ${guild.id}`)
  }
})

// Delete guilds the bot is removed from
client.on("guildDelete", async guild => {
  await prisma.guild.delete({
    where: { id: guild.id }
  })
})

// Handle presence updates
client.on("presenceUpdate", async (_, newPresence) => {
  const user = client.users.cache.get(newPresence.userId) ?? (await client.users.fetch(newPresence.userId))
  if (user.bot) return

  // Get guilds from database where the user is a mod
  const relations = await prisma.moderatorGuild.findMany({ where: { moderatorId: user.id }, select: { guild: true } })
  const guilds = relations.map(relation => relation.guild)

  // Ignore presences of regular users
  for (const { id, roleActive, roleDefault } of guilds) {
    if (!roleActive || !roleDefault) continue

    const guild = await client.guilds.fetch(id)
    const member = guild.members.cache.get(user.id) ?? (await guild.members.fetch(user.id))
    if (!member.roles.cache.has(roleDefault)) continue

    const status = newPresence.status

    // Remove active role if user is offline
    if ((status === "offline" || status === "dnd") && member.roles.cache.has(roleActive)) {
      member.roles.remove(roleActive).catch(console.error)

      console.log(`Marked user ${member.user.id} as active in guild ${guild.id}`)
    }

    // Add active role if user is online
    if ((status === "online" || status === "idle") && !member.roles.cache.has(roleActive)) {
      member.roles.add(roleActive).catch(console.error)

      console.log(`Marked user ${member.user.id} as inactive in guild ${guild.id}`)
    }
  }
})

// Handle slash commands
client.on("interactionCreate", async interaction => {
  if (interaction.user.bot || !interaction.isChatInputCommand()) return
  if (interaction.commandName !== "setmodrole") return

  const guild = interaction.guild!
  const role = (await guild.roles.fetch(interaction.options.getRole("role", true).id))!

  const command = interaction.options.getSubcommand()

  if (command === "active") {
    const clientMember = await guild.members.fetch(client.user.id)

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

  // Save to database
  await prisma.guild.upsert({
    where: { id: guild.id },
    create: {
      id: interaction.guildId!,
      roleActive: command === "active" ? role.id : undefined,
      roleDefault: command === "default" ? role.id : undefined
    },
    update: {
      roleActive: command === "active" ? role.id : undefined,
      roleDefault: command === "default" ? role.id : undefined
    }
  })

  await prisma.$transaction(
    role.members.map(member =>
      prisma.moderator.upsert({
        where: { id: member.id },
        create: { id: member.id },
        update: { id: member.id }
      })
    )
  )

  await prisma.$transaction(
    role.members.map(member =>
      prisma.moderatorGuild.upsert({
        where: { moderatorId_guildId: { guildId: guild.id, moderatorId: member.id } },
        create: { guildId: guild.id, moderatorId: member.id },
        update: { guildId: guild.id, moderatorId: member.id }
      })
    )
  )

  console.log(`Setup role ${role.id} as ${command} role in guild ${guild.id}`)

  interaction
    .reply({ embeds: [embed(`Successfully set <@&${role.id}> as the ${command} mod role!`)], ephemeral: true })
    .catch(console.error)
})

// Login bot
client.once("ready", () => console.log(`Logged in as ${client.user.username}`))
client.login(process.env.TOKEN)
