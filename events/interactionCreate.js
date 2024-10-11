const chalk = require('chalk');
const { getPasteUrl, PrivateBinClient } = require('@agc93/privatebin');
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js');
const nodemailer = require('nodemailer');
const { token, clientId, guildId, roleId, email } = require('../config.json');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MEMBERS
  ]
});
module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    if (!interaction.isButton()) return;

    if (interaction.customId === "open-ticket") {
      const existingChannel = client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic === interaction.user.id);

      if (existingChannel) {
        await interaction.reply({
          content: 'Je hebt al een open of onverwijderd ticket, je kan maar 1 ticket tegelijk hebben!',
          ephemeral: true
        });
        setTimeout(() => {
          interaction.deleteReply().catch(console.error);
        }, 5000);
        return;
      }

      interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: client.config.parentOpened,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: "GUILD_TEXT",
      }).then(async c => {
        interaction.deferReply({ ephemeral: true }).then(() => {
          interaction.followUp({
            content: `Ticket gemaakt! <#${c.id}>`,
            ephemeral: true
          });
          setTimeout(() => {
            interaction.deleteReply().catch(console.error);
          }, 5000);
        });

        const embed = new client.discord.MessageEmbed()
          .setColor('00cb9c')
          .setAuthor({ name: `${interaction.user.username}'s Ticket`, iconURL: 'https://i.imgur.com/JEI24aE.png' })
          .setDescription('Waarover gaat de ticket? Selecteer een categorie.');

        const row = new client.discord.MessageActionRow()
          .addComponents(
            new client.discord.MessageSelectMenu()
              .setCustomId('category')
              .setPlaceholder('Selecteer een categorie')
              .addOptions([{
                  label: client.config.Category1,
                  value: client.config.Category1,
                  emoji: '❓',
                },
                {
                  label: client.config.Category2,
                  value: client.config.Category2,
                  emoji: '➕',
                },
                {
                  label: client.config.Category3,
                  value: client.config.Category3,
                  emoji: '💬',
                },
              ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 20000 // 20 seconds
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new client.discord.MessageEmbed()
                  .setColor('00cb9c')
                  .setAuthor({ name: 'Ticket', iconURL: interaction.user.displayAvatarURL() })
                  .setDescription(`<@!${interaction.user.id}> heeft een ticket aangemaakt met \`${i.values[0]}\` als onderwerp`);

                const row = new client.discord.MessageActionRow()
                  .addComponents(
                    new client.discord.MessageButton()
                      .setCustomId('close-ticket')
                      .setLabel('Sluiten')
                      .setEmoji('🔒')
                      .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.roleSupport}>`,
                  embeds: [embed],
                  components: [row]
                });
              });
            }
          }
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
            c.send(`Je hebt geen categorie geselecteerd. De ticket wordt gesloten`).then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                }
              }, 5000);
            });
          }
        });
      });
    }

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
            .setCustomId('confirm-close')
            .setLabel('Sluiten')
            .setStyle('DANGER'),
          new client.discord.MessageButton()
            .setCustomId('no')
            .setLabel('Annuleren')
            .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: 'Ben je zeker dat je de ticket wilt sluiten?',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `Ticket gesloten door <@!${interaction.user.id}>`,
            components: []
          });

          chan.edit({
              name: `closed-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.roleSupport,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
            .then(async () => {
              const embed = new client.discord.MessageEmbed()
                .setColor('00cb9c')
                .setDescription('```Je ticket is gesloten, met de knop hieronder verwijder je dit chatkanaal```');

              const row = new client.discord.MessageActionRow()
                .addComponents(
                  new client.discord.MessageButton()
                    .setCustomId('delete-ticket')
                    .setLabel('Verwijderen')
                    .setEmoji('🗑️')
                    .setStyle('DANGER'),
                );

              chan.send({
                embeds: [embed],
                components: [row]
              });
            });

          collector.stop();
        }
        if (i.customId == 'no') {
          interaction.editReply({
            content: 'Ticket sluiten geannuleerd!',
            components: []
          });
          collector.stop();
          setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        }
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: 'Ticket sluiten geannuleerd!',
            components: []
          });
          collector.stop();
          setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        }
      });
    }

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      interaction.reply({
        content: 'Ticket Logs Opslaan & Versturen...'
      });

      chan.messages.fetch().then(async (messages) => {
    let a = messages.filter(m => !m.author.bot).map(m =>
        `${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
    ).reverse().join('\n');
    if (a.length < 1) a = "Nothing";

    
        var paste = new PrivateBinClient("https://privatebin.net/");
        var result = await paste.uploadContent(a, { uploadFormat: 'markdown' });
        const embed = new client.discord.MessageEmbed()
          .setAuthor({ name: 'Ticket Logs', iconURL: 'https://i.imgur.com/JEI24aE.png' })
          .setDescription(`📰 Logs voor ticket \`${chan.id}\` | gemaakt door <@!${chan.topic}> | gesloten door <@!${interaction.user.id}>\n\nLogs: [**Klik hier om de logs te bekijken**](${getPasteUrl(result)})`)
          .setColor('00cb9c')
          .setFooter({ text: "Deze logs zijn maar 24 uur geldig!" })
          .setTimestamp();

        const embed2 = new client.discord.MessageEmbed()
          .setAuthor({ name: 'Je ticket in de ELO ICT Discord is gesloten', iconURL: 'https://i.imgur.com/JEI24aE.png' })
          .setDescription(`📰 Logs voor ticket \`${chan.id}\`: [**Klik hier om de logs te bekijken**](${getPasteUrl(result)})`)
          .setColor('00cb9c')
          .setFooter({ text: "Deze logs zijn maar 24 uur geldig!" })
          .setTimestamp();

        client.channels.cache.get(client.config.logsTicket).send({
          embeds: [embed]
        }).catch(() => console.log("Kanaal voor ticket logs niet gevonden"));

        const embed3 = new client.discord.MessageEmbed()
          .setDescription("Deze ticket channel wordt over een paar seconden verwijdert")
          .setColor('8B0000');
        chan.send({ embeds: [embed3] });
        const user = interaction.user;
        user.send({ embeds: [embed2] });

        setTimeout(() => {
          chan.delete();
        }, 5000);
      });
    }
  }}

 client.on('voiceStateUpdate', async (oldState, newState) => {
    // The IDs of the 'Join to make a room' channels with different user limits
    const joinToCreateChannelId2 = '1293550783756767323'; // Room with 2 user limit
  const joinToCreateChannelId3 = '1293550808574726226'; // Room with 3 user limit
  const joinToCreateChannelId4 = '1293550858440671232'; // Room with 4 user limit
  const joinToCreateChannelIdUnlimited = '1293550914480640100'; // Room with no user limit
  
    const user = newState.member.user;
    const guild = newState.guild;
    let userLimit = 0; // Default is 0 (no limit)
  
    // Check which channel the user joined and set the user limit accordingly
    if (newState.channelId === joinToCreateChannelId2) {
      userLimit = 2; // Limit room to 2 users
    } else if (newState.channelId === joinToCreateChannelId3) {
      userLimit = 3; // Limit room to 3 users
    } else if (newState.channelId === joinToCreateChannelId4) {
      userLimit = 4; // Limit room to 4 users
    } else if (newState.channelId === joinToCreateChannelIdUnlimited) {
      userLimit = 0; // No user limit (0 means unlimited users)
    } else {
      return; // Return early if the user didn't join any of the specified channels
    }
  
    // Create a new temporary voice channel with the appropriate user limit
    const tempChannel = await guild.channels.create(`${user.username}'s Room`, {
      type: 'GUILD_VOICE',
      parent: newState.channel.parentId, // Keep the temporary channel in the same category
      userLimit: userLimit, // Set the user limit (0 means unlimited)
      permissionOverwrites: [
        {
          id: user.id, // Give the user access to the room
          allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'],
        },
        {
          id: guild.roles.everyone.id, // Deny access for everyone else initially
          deny: ['VIEW_CHANNEL'],
        },
		  {
          id: '1293549211433832511', // Deny access for everyone else initially
          allow: ['VIEW_CHANNEL'],
        }
      ]
    });
  
    // Move the user to the new temporary voice channel
    await newState.setChannel(tempChannel);
  
    // Function to check and delete the temporary channel when it's empty
    const checkEmptyChannel = async () => {
      if (tempChannel.members.size === 0) {
        // Delete the channel if it's empty
        await tempChannel.delete().catch(console.error);
      }
    };
  
    // Set an interval to check if the channel is empty
    const interval = setInterval(() => {
      if (tempChannel.deleted) {
        // Stop checking if the channel has already been deleted
        clearInterval(interval);
      } else {
        checkEmptyChannel();
      }
    }, 500); // Check every 0,5 seconds
  });

  const WELCOME_CHANNEL_ID = '1290295707408011307';

  client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel || !channel.isText()) return; 

    const welcomeEmbed = new MessageEmbed()
    .setColor('#00cb9c')
    .setTitle(':exclamation: __Zodra je geverifieerd bent kan je onderstaande kanalen bekijken__')
    .setDescription('Je kan jezelf verifiëren via <#1293551793392980038>, volg daarna even onderstaande stappen.')
    .addFields(
        { name: ' ', value: 'Lees even de <#1290295920956670025> door en als je je afvraagt hoe de server werkt, lees ook even de <#1290295891030310932>.' },
    )
    .setThumbnail('https://i.imgur.com/XK91zwy.png')
    .setFooter( {text: 'Veel Plezier!'})
    .setAuthor({ name: 'Welkom in de Discord van Elektronica ICT', iconURL: 'https://i.imgur.com/JEI24aE.png' })

    try {
      await channel.send({
        content: `${member}`,
        embeds: [welcomeEmbed]
    });
    } catch (error) {
        console.error('Welkomsbericht versturen mislukt!:', error);
    }
  });
  // Role and message details
  const channelId = '1290295963461881948';
const rolesEmbed1 = {
    '1️⃣': '1290312388486234262', // Role for ICT Fase 1
    '2️⃣': '1290312428986302607', // Role for ICT Fase 2
    '3️⃣': '1290312455230328964'  // Role for ICT Fase 3
};

const rolesEmbed2 = {
    '1️⃣': '1290312490357489725', // Role for Elektronica Fase 1
    '2️⃣': '1290312518341755011', // Role for Elektronica Fase 2
    '3️⃣': '1290312559345270886'  // Role for Elektronica Fase 3
};

// Define the third role with heavy_plus_sign emoji
const rolesEmbed3 = {
    '➕': '1293552694749036626' // Role for general or special category
};

// Store the IDs of the messages the bot sends
let embedMessageId1;
let embedMessageId2;
let embedMessageId3;

client.once('ready', async () => {
    console.log(chalk.blue(` ====> Ingelogd als ${client.user.tag}`));

    try {
        const channel = await client.channels.fetch(channelId);

        // Fetch the last 10 messages to find the embeds
        const messages = await channel.messages.fetch({ limit: 10 });
        const embedMessage1 = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title.includes('Kies in welke afstudeerrichting en fase je zit (meerdere toegestaan)__') && msg.embeds[0].description.includes('ICT Fase'));
        const embedMessage2 = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title.includes('Kies in welke afstudeerrichting en fase je zit (meerdere toegestaan)__') && msg.embeds[0].description.includes('Elektronica Fase'));
        const embedMessage3 = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title.includes('Kies als je je keuzevak nergens kan vinden'));

        if (embedMessage1) {
            embedMessageId1 = embedMessage1.id;
            console.log(
              chalk.red('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+\n') +
              chalk.green(`Er bestaat al een interface voor ICT: ${embedMessageId1}`)
            );
          
        } else {
            // Create the first embed message
            const embed1 = new MessageEmbed()
                .setTitle(':exclamation: __Kies in welke afstudeerrichting en fase je zit (meerdere toegestaan)__')
                .setDescription('1️⃣  ICT Fase 1\n2️⃣  ICT Fase 2\n3️⃣  ICT Fase 3')
                .setColor('#00cb9c')
                .setAuthor({ name: 'Selecteer de rollen die je wilt en kanalen zullen tevoorschijn komen', iconURL: 'https://i.imgur.com/JEI24aE.png' })
                .setThumbnail('https://i.imgur.com/8aDn181.png');

            // Send the first embed message
            const message1 = await channel.send({ embeds: [embed1] });
            embedMessageId1 = message1.id;
        }

        if (embedMessage2) {
            embedMessageId2 = embedMessage2.id;
            console.log(
              chalk.green(`Er bestaat al een interface voor Elektronica: ${embedMessageId2}\n`) +
              chalk.red('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+') 
            );

        } else {
            // Create the second embed message
            const embed2 = new MessageEmbed()
                .setTitle(':exclamation: __Kies in welke afstudeerrichting en fase je zit (meerdere toegestaan)__')
                .setDescription('1️⃣  Elektronica Fase 1\n2️⃣  Elektronica Fase 2\n3️⃣  Elektronica Fase 3')
                .setColor('#00cb9c')
                .setAuthor({ name: 'Selecteer de rollen die je wilt en kanalen zullen tevoorschijn komen', iconURL: 'https://i.imgur.com/JEI24aE.png' })
                .setThumbnail('https://i.imgur.com/lFQUvde.png');

            // Send the second embed message
            const message2 = await channel.send({ embeds: [embed2] });
            embedMessageId2 = message2.id;
        }

        if (embedMessage3) {
            embedMessageId3 = embedMessage3.id;
            console.log(
              chalk.green(`Er bestaat al een interface voor de algemene rol: ${embedMessageId3}\n`) +
              chalk.red('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+') 
            );
        } else {
            // Create the third embed message for the general role
            const embed3 = new MessageEmbed()
                .setTitle(':exclamation: __Kies als je je keuzevak nergens kan vinden__')
                .setDescription('➕  Alle keuzevakken die nog geen channel hebben.')
                .setColor('#00cb9c')
                .setAuthor({ name: 'Selecteer de rollen die je wilt en kanalen zullen tevoorschijn komen', iconURL: 'https://i.imgur.com/JEI24aE.png' })
                .setThumbnail('https://i.imgur.com/1i5mch1.png');

            // Send the third embed message
            const message3 = await channel.send({ embeds: [embed3] });
            embedMessageId3 = message3.id;
        }

        // React with the specified emojis on all messages
        for (const emoji of Object.keys(rolesEmbed1)) {
            if (embedMessageId1) await channel.messages.fetch(embedMessageId1).then(msg => msg.react(emoji));
        }
        for (const emoji of Object.keys(rolesEmbed2)) {
            if (embedMessageId2) await channel.messages.fetch(embedMessageId2).then(msg => msg.react(emoji));
        }
        for (const emoji of Object.keys(rolesEmbed3)) {
            if (embedMessageId3) await channel.messages.fetch(embedMessageId3).then(msg => msg.react(emoji));
        }

        console.log(chalk.green('✔ Interfaces voor rollen compleet.'));
    } catch (error) {
        console.error('Mislukt om interfaces of reacties te versturen', error);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (!user.bot && reaction.message.channel.id === channelId) {
        let roleId;

        // Check if the reaction is for the first, second, or third embed
        if (reaction.message.id === embedMessageId1) {
            roleId = rolesEmbed1[reaction.emoji.name];
        } else if (reaction.message.id === embedMessageId2) {
            roleId = rolesEmbed2[reaction.emoji.name];
        } else if (reaction.message.id === embedMessageId3) {
            roleId = rolesEmbed3[reaction.emoji.name];
        }

        if (roleId) {
            const guild = reaction.message.guild;
            const member = guild.members.cache.get(user.id);
            if (member) {
                try {
                    await member.roles.add(roleId);
                    console.log(`Rol ${roleId} toegevoegd aan ${user.tag} door te reageren met ${reaction.emoji.name}`);
                } catch (error) {
                    console.error(`Rol toevoegen mislukt!: ${error}`);
                }
            }
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (!user.bot && reaction.message.channel.id === channelId) {
        let roleId;

        // Check if the reaction is for the first, second, or third embed
        if (reaction.message.id === embedMessageId1) {
            roleId = rolesEmbed1[reaction.emoji.name];
        } else if (reaction.message.id === embedMessageId2) {
            roleId = rolesEmbed2[reaction.emoji.name];
        } else if (reaction.message.id === embedMessageId3) {
            roleId = rolesEmbed3[reaction.emoji.name];
        }

        if (roleId) {
            const guild = reaction.message.guild;
            const member = guild.members.cache.get(user.id);
            if (member) {
                try {
                    await member.roles.remove(roleId);
                    console.log(`Rol ${roleId} verwijderd van ${user.tag} door ${reaction.emoji.name} af te vinken`);
                } catch (error) {
                    console.error(`Rol verwijderen mislukt!: ${error}`);
                }
            }
        }
    }
});

const activeCodes = new Map(); // Store verification codes with user IDs

// Create a Nodemailer transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Specify the SMTP server
  port: 587, // Use port 587 for TLS
  secure: false, // Use true for port 465, false for other ports
  auth: {
    user: email.user,
    pass: email.pass,
  },
  tls: {
    rejectUnauthorized: false, // For self-signed certificates
  },
});

client.once('ready', async () => {
  const channel = client.channels.cache.get('1293551793392980038');
  if (channel) await sendOrReuseVerificationMessage(channel);
});

async function sendOrReuseVerificationMessage(channel) {
  try {
    // Fetch messages in the channel
    const messages = await channel.messages.fetch({ limit: 100 });

    // Look for an existing embed message sent by the bot with the verification embed content
    const existingMessage = messages.find(
      (msg) =>
        msg.author.id === client.user.id &&
        msg.embeds[0] &&
        msg.embeds[0].title === 'Verificatie voor Odisee Studenten'
    );

    if (existingMessage) {
      console.log(chalk.green('Er bestaat al een interface voor verificatie, we hergebruiken deze.'));
    } else {
      console.log(chalk.yellow('Geen bestaande interface gevonden voor verificatie, we sturen een nieuwe.'));
      const embed = new MessageEmbed()
        .setColor('00cb9c')
        .setThumbnail('https://i.imgur.com/z52z82q.png')
        .setTitle('Verificatie voor Odisee Studenten')
        .addFields(
          {
            name: 'Stappen:',
            value:
              '1. Klik op de knop "Email Invoeren" hieronder en vul je e-mailadres in.\n2. Je ontvangt een code in je inbox (controleer ook je map "ongewenste berichten").',
          },
          {
            name: 'Code Invoeren:',
            value:
              'Zodra je de code hebt ontvangen, klik je op de knop "Ik heb een code" en vul je de code in!',
          },
          { name: 'Afgestudeerd?', value: 'Druk op de knop "Ik ben Afgestudeerd" om toegang te krijgen tot de algemene kanalen.' },

          {
            name: 'Problemen?',
            value:
              'Maak een ticket aan in <#1290295977403617341> en we helpen je zo snel mogelijk verder!',
          }
        );

      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('verify_email')
          .setLabel('Email Invoeren')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('already_have_code')
          .setLabel('Ik heb een code')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('toggle_afgestudeerd')
          .setLabel('Ik ben afgestudeerd')
          .setStyle('SECONDARY') // Green button for toggling the "AFGESTUDEERD" role
      );

      await channel.send({ embeds: [embed], components: [row] });
    }
  } catch (error) {
    console.error('Error checking for existing verification message:', error);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, user } = interaction;

  if (customId === 'verify_email') {
    const modal = new Modal()
      .setCustomId('email_modal')
      .setTitle('Odisee Email Invoeren')
      .addComponents(
        new MessageActionRow().addComponents(
          new TextInputComponent()
            .setCustomId('email_input')
            .setLabel('Email Adres')
            .setStyle('SHORT')
            .setPlaceholder('voornaam.naam@student.odisee.be')
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
  }

  if (customId === 'already_have_code') {
    const modal = new Modal()
      .setCustomId('code_modal')
      .setTitle('Verificatiecode Invoeren')
      .addComponents(
        new MessageActionRow().addComponents(
          new TextInputComponent()
            .setCustomId('code_input')
            .setLabel('Verificatie Code')
            .setStyle('SHORT')
            .setPlaceholder('123456')
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
  }

  if (customId === 'toggle_afgestudeerd') {
    const member = interaction.guild.members.cache.get(user.id);
    const role = interaction.guild.roles.cache.get('1293568921454120980');

    if (member && role) {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        await interaction.reply({
          content: 'De "Afgestudeerd" rol is verwijderd.',
          ephemeral: true,
        });
      } else {
        await member.roles.add(role);
        await interaction.reply({
          content: 'Je hebt de "Afgestudeerd" rol gekregen!',
          ephemeral: true,
        });
      }
      setTimeout(() => {
        interaction.deleteReply().catch(console.error);
      }, 10000);
    } else {
      await interaction.reply({
        content: 'Kon de rol niet aanpassen. Maak een ticket aan.',
        ephemeral: true,
      });
      setTimeout(() => {
        interaction.deleteReply().catch(console.error);
      }, 10000);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const { customId, fields, user } = interaction;

  if (customId === 'email_modal') {
    const emailAddress = fields.getTextInputValue('email_input');

    // Check if the email ends with '@student.odisee.be'
    if (!emailAddress.endsWith('@student.odisee.be')) {
      await interaction.reply({ content: 'Dit is geen Odisee e-mail adres', ephemeral: true });
      setTimeout(() => {
        interaction.deleteReply();
      }, 7000);
      return;
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await transporter.sendMail({
          from: email.user,
          to: emailAddress,
          subject: 'Jouw Verificatiecode',
          html: `
              <p>Beste student, bedankt voor het verifiëren in onze Discord.</p>
              <p>Je verificatiecode is:</p>
              <p style="font-size: 24px; font-weight: bold;">${verificationCode}</p>
              <p>Deze code is 30 minuten geldig.</p>
          `
      });

      // Store the code and set a timer for 30 minutes (1.800.000 ms)
      activeCodes.set(user.id, { code: verificationCode, expiresAt: Date.now() + 18000000 });

      // Inform the user that the code has been sent
      await interaction.reply({
        content: 'Er is een verificatiecode verstuurd naar je Odisee email. Check ook de "Ongewenste berichten" map. ',
        ephemeral: true,
      });
      setTimeout(() => {
        interaction.deleteReply().catch(console.error);
      }, 10000);

      // Set a timeout to remove the code after 30 minutes
      setTimeout(() => {
        const storedData = activeCodes.get(user.id);
        if (storedData && storedData.expiresAt <= Date.now()) {
          activeCodes.delete(user.id);
        }
      }, 18000000);
    } catch (error) {
      console.error('Versturen email mislukt:', error);
      await interaction.reply({
        content: 'Email versturen mislukt. Probeer het later opnieuw.',
        ephemeral: true,
      });
      setTimeout(() => {
        interaction.deleteReply().catch(console.error);
      }, 10000);
    }
  }

  if (customId === 'code_modal') {
    const inputCode = fields.getTextInputValue('code_input');
    const storedData = activeCodes.get(user.id);

    // Check if a code exists and if it is still valid
    if (storedData && storedData.expiresAt > Date.now()) {
      if (storedData.code === inputCode) {
        const member = interaction.guild.members.cache.get(user.id);
        const role = interaction.guild.roles.cache.get(roleId);

        if (member && role) {
          await member.roles.add(role);
          activeCodes.delete(user.id);
          await interaction.reply({
            content: 'Je bent geverifieerd en je hebt de "Verified" rol gekregen!',
            ephemeral: true,
          });
          setTimeout(() => {
            interaction.deleteReply().catch(console.error);
          }, 10000);
        } else {
          await interaction.reply({
            content: 'Kon de rol niet toevoegen. Maak een ticket aan.',
            ephemeral: true,
          });
          setTimeout(() => {
            interaction.deleteReply().catch(console.error);
          }, 10000);
        }
      } else {
        await interaction.reply({
          content: 'De code die je hebt ingevoerd is ongeldig. Probeer opnieuw.',
          ephemeral: true,
        });
        setTimeout(() => {
          interaction.deleteReply().catch(console.error);
        }, 10000);
      }
    } else {
      await interaction.reply({
        content: 'Je code is vervallen. Vraag een nieuwe aan.',
        ephemeral: true,
      });
      setTimeout(() => {
        interaction.deleteReply().catch(console.error);
      }, 10000);
    }
  }
});
// Replace with your specific channel ID
const channelIdstatus = '1290305355087347764';

// This event triggers when a user's presence updates (e.g., they come online/offline)
client.on('presenceUpdate', (oldPresence, newPresence) => {
    // Check if the presence update is for a bot and the status changed to online
    if (newPresence.user.bot && newPresence.status === 'online') {
        const channel = client.channels.cache.get(channelIdstatus);
        if (!channel) return console.error('Channel not found');

        // Create an embed message
        const embed = new EmbedBuilder()
            .setTitle('Bot Online')
            .setDescription(`${newPresence.user.username} is now online!`)
            .setColor(0x00FF00) // Green color to indicate online status
            .setTimestamp();

        // Send the embed to the specified channel
        channel.send({ embeds: [embed] })
            .catch(console.error);
    }
});


  client.login(token);
  