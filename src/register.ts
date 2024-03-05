import { PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from "discord.js"
import dotenv from "dotenv"

dotenv.config()

const rest = new REST().setToken(process.env.TOKEN)

// Create commands
const about = new SlashCommandBuilder()
  .setName("about")
  .setDescription("About this bot")
  .setDMPermission(true)
  .setNSFW(false)
const setmodrole = new SlashCommandBuilder()
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
      .addRoleOption(role => role.setName("role").setDescription("The role to give to active mods").setRequired(true))
  )

// Register commands
rest
  .put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [about.toJSON(), setmodrole.toJSON()] })
  .then(() => console.log("Successfully registered commands"))
