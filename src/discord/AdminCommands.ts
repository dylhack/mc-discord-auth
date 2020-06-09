import { Bot } from "./Bot";
import { DBController } from "../db";
import { Message } from "discord.js";
import * as mc from "../minecraft";

export class AdminCommands {
  private readonly bot: Bot;
  private readonly db: DBController;

  constructor(bot: Bot, db: DBController) {
    this.bot = bot;
    this.db = db;
  }

  /**
   * Admin help command
   */
  public async help(msg: Message) {
    if (!msg.member)
      return;
    const bot = this.bot;
    const isAdmin = bot.isAnAdmin(msg.member);

    if (isAdmin) {
      await msg.reply(
        "Admin Commands:\n" +
        ` - ${bot.prefix} unlink <Minecraft player name or @ discord member\n` +
        ` - ${bot.prefix} maintenance Toggles "maintenance mode"\n` +
        ` - ${bot.prefix} ban <@discord member> Ban bot usage\n` +
        ` - ${bot.prefix} pardon <@discord member>\n` +
        ` - ${bot.prefix} status Display debug info`
      );
    } else {
      await msg.reply("You're not an admin.");
    }
  }

  /**
   * Unlink ADMIN command
   * @param {Message} msg
   * @param {string[]} args Possible Iterations:
   *  * ["<bot prefix>", "unlink", "<@discord member>"]
   *  * ["<bot prefix>", "unlink", "<minecraft player>"]
   */
  public async unlink(msg: Message, args: string[]) {
    if (!msg.member)
      return;

    // Let's make sure they have perms
    const hasPerms = this.bot.isAnAdmin(msg.member);
    if (!hasPerms) {
      await msg.reply("You don't have permissions to use this command");
      return;
    }

    // Check if they're mentioning someone
    // args = ["<bot prefix>", "unlink", "<@discord member>"]
    if (msg.mentions.members != null) {
      const target = msg.mentions.members.first();

      if (target) {
        this.db.links.unlinkDiscordAcc(target.id);
        await msg.reply(
          `Unlinked ${target.user.username}'s claimed Minecraft account
          `);
      } else {
        await msg.reply("Please mention a member you want to unlink");
      }
      return;
    }

    // Check if they're talking about a Minecraft account
    // ["<bot prefix>", "unlink", "<minecraft player>"]
    const playerName = args[2];
    try {
      const playerUUID = await mc.getUUID(playerName);
      this.db.links.unlinkMcAcc(playerUUID);
      await msg.reply(`Unlinked "${playerName}"`);
    } catch (err) {
      await msg.reply("That's not a valid Minecraft player name");
    }
  }

  /**
   * This toggles maintenance mode.
   * @param msg
   */
  public async maintenance(msg: Message) {
    if (!msg.member)
      return;

    // Let's make sure they have perms
    const hasPerms = this.bot.isAnAdmin(msg.member);
    if (!hasPerms) {
      await msg.reply("You don't have permissions to use this command");
      return;
    }

    const isOn = this.bot.maintenanceMode();

    if (isOn)
      await msg.reply("Maintenance mode is now on.");
    else
      await msg.reply("Maintenance mode is now off.");
  }

  /**
   * This is the ban command
   * @param msg
   */
  public async ban(msg: Message) {
    if (!msg.mentions.members || !msg.member)
      return;

    // Let's make sure they have perms
    const hasPerms = this.bot.isAnAdmin(msg.member);
    if (!hasPerms) {
      await msg.reply("You don't have permissions to use this command");
      return;
    }

    const target = msg.mentions.members.first();

    if (target) {
      try {
        this.db.bans.ban(target.id);
        await msg.reply(`Banned "${target.user.username}"`);
      } catch (err) {
        await msg.reply("This member is already banned.");
      }

    } else {
      await msg.reply("Mention the member you would like to ban from" +
        " using this bot.")
    }
  }

  /**
   * This is the pardon command
   * @param msg
   */
  public async pardon(msg: Message) {
    if (!msg.mentions.members || !msg.member)
      return;

    // Let's make sure they have perms
    const hasPerms = this.bot.isAnAdmin(msg.member);
    if (!hasPerms) {
      await msg.reply("You don't have permissions to use this command");
      return;
    }

    const target = msg.mentions.members.first();

    if (target) {
      try {
        this.db.bans.pardon(target.id);
        await msg.reply(`Pardoned "${target.user.username}"`);
      } catch (err) {
        await msg.reply("This member is not banned.");
      }

    } else {
      await msg.reply("Mention the member you would like to pardon.")
    }
  }
}
