import { EmbedBuilder } from "discord.js"

export default function embed(content: string) {
  return new EmbedBuilder().setDescription(content)
}
