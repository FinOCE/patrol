import { PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from "discord.js"
import dotenv from "dotenv"

dotenv.config()

const rest = new REST().setToken(process.env.TOKEN)

// Create commands to manage mod roles
const command = new SlashCommandBuilder()
  .setName("setmodrole")
  .setDescription("Set the mod roles for this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false)
  .addSubcommand(builder =>
    builder
      .setName("default")
      .setDescription("Set the default role all mods have")
      .addRoleOption(role => role.setName("role").setDescription("The default role all mods have").setRequired(true))
  )
  .addSubcommand(builder =>
    builder
      .setName("active")
      .setDescription("Set the role to give to active mods")
      .addRoleOption(role => role.setName("role").setDescription("The role togive to active mods").setRequired(true))
  )

// Register mod role commands
rest
  .put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [command.toJSON()] })
  .then(() => console.log("Successfully registered mod role commands"))
