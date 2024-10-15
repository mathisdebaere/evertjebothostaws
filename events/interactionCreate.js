const chalk = require('chalk');
const { getPasteUrl, PrivateBinClient } = require('@agc93/privatebin');
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu } = require('discord.js');
const nodemailer = require('nodemailer');
const { token, clientId, guildId, roleId, email, welcomeChannel, joinToCreateChannelId2, joinToCreateChannelId3, joinToCreateChannelId4, joinToCreateChannelIdUnlimited, verifyChannel, graduateRole, roleChannel } = require('../config.json');
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
              .setCustomId('ticketcategory')
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
          id: roleId, // Deny access for everyone else initially
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

  client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(welcomeChannel);
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
  const channel = client.channels.cache.get(verifyChannel);
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
    const role = interaction.guild.roles.cache.get(graduateRole);

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

const roleOptions = {
  '1ste jaar': {
    'Semester 1': [
      { label: 'Elektronische Netwerken', value: 'Elektronische Netwerken' },
      { label: 'Elektronische Realisatietechnieken', value: 'Elektronische Realisatietechnieken' },
      { label: 'Programming Fundamentals', value: 'Programming Fundamentals' },
      { label: 'Web Introduction', value: 'Web Introduction' },
      { label: 'Infrastructure Fundamentals', value: 'Infrastructure Fundamentals' },
      { label: 'Fundamental Skills for ICT', value: 'Fundamental Skills for ICT' },
    ],
    'Semester 2': [
      { label: 'OO Programming', value: 'OO Programming' },
      { label: 'Database Programming', value: 'Database Programming' },
      { label: 'Hackathon', value: 'Hackathon' },
      { label: 'Network Infrastructure 1', value: 'Network Infrastructure 1' },
      { label: 'Server Infrastructure: Windows', value: 'Server Infrastructure: Windows' },
      { label: 'Front-end Development', value: 'Front-end Development' },
      { label: 'Digitale Technieken', value: 'Digitale Technieken' },
      { label: 'Elektronische Componenten en Schakelingen', value: 'Elektronische Componenten en Schakelingen' },
    ],
  },
  '2de jaar': {
    'Semester 1': [
      { label: 'Professionele Communicatie', value: 'Professionele Communicatie' },
      { label: 'Ethiek', value: 'Ethiek' },
      { label: 'Network Infrastructure 2', value: 'Network Infrastructure 2' },
      { label: 'Server Infrastructure: Linux', value: 'Server Infrastructure: Linux' },
      { label: 'Back-end Development', value: 'Back-end Development' },
      { label: 'Full-stack: Introductory Project', value: 'Full-stack: Introductory Project' },
      { label: 'Analoge Systemen', value: 'Analoge Systemen' },
      { label: 'Filters', value: 'Filters' },
      { label: 'IoT: Microcontrollers', value: 'IoT: Microcontrollers' },
      { label: 'Algo & Data', value: 'Algo & Data' },
      { label: '.NET Programming', value: '.NET Programming' }
      
    ],
    'Semester 2': [
      { label: 'Project & Wetenschappelijk Rapporteren', value: 'Project & Wetenschappelijk Rapporteren' },
      { label: 'Data Security', value: 'Data Security' },
      { label: 'Infrastructure as Code', value: 'Infrastructure as Code' },
      { label: 'Full-stack Development', value: 'Full-stack Development' },
      { label: 'Signaalverwerking', value: 'Signaalverwerking' },
      { label: 'Telecommunicatie', value: 'Telecommunicatie' },
      { label: '.NET Advanced Programming', value: '.NET Advanced Programming' },
      { label: 'IoT: Datacommunicatie', value: 'IoT: Datacommunicatie' },
      { label: 'Data Science', value: 'Data Science' },
    ],
  },
  '3de jaar': {
    'Semester 1': [
      { label: 'Agile Team Project', value: 'Agile Team Project' },
      { label: 'Security Infrastructure', value: 'Security Infrastructure' },
      { label: 'Cloud Infrastructure', value: 'Cloud Infrastructure' },
      { label: 'Mobile Application Development', value: 'Mobile Application Development' },
      { label: 'Geavanceerd Printontwerp', value: 'Geavanceerd Printontwerp' },
      { label: 'Industriële Toepassingen', value: 'Industriële Toepassingen' },
      { label: 'Videotechniek', value: 'Videotechniek' },
      { label: 'IoT: Embedded Linux', value: 'IoT: Embedded Linux' },
      { label: 'Applied Programming', value: 'Applied Programming' },
      { label: 'AI', value: 'AI' },
    ],
    'Semester 2': [
      { label: 'Stage', value: 'Stage' },
      { label: 'Bachelorproef', value: 'Bachelorproef' },
    ],
  },
  'Keuzevakken': [
    { label: 'Digitaal Systeemontwerp', value: 'Digitaal Systeemontwerp' },
    { label: 'Web Programming on Servers and Devices', value: 'Web Programming on Servers and Devices' },
    { label: 'Web Topics', value: 'Web Topics' },
    { label: 'Web Topics Advanced', value: 'Web Topics Advanced' },
    { label: 'Advanced Networking Technology', value: 'Advanced Networking Technology' },
    { label: 'UX Design', value: 'UX Design' },
    { label: 'Signaalverwerking voor ICT', value: 'Signaalverwerking voor ICT' },
    { label: 'Hoogfrequenttechniek', value: 'Hoogfrequenttechniek' },
    { label: '.NET Back-end Development', value: '.NET Back-end Development' },
    { label: '.NET Front-end Development', value: '.NET Front-end Development' },
    { label: 'Entrepreneurial Skills', value: 'Entrepreneurial Skills' },
    { label: 'Persoonlijk Ontwikkelingsplan', value: 'Persoonlijk Ontwikkelingsplan' },
    { label: 'Mobiliteit', value: 'Mobiliteit' },
    { label: 'Unlimited Learning', value: 'Unlimited Learning' },
    { label: 'Ondernemen', value: 'Ondernemen' },
    { label: 'Wiskunde', value: 'Wiskunde' },
    { label: 'Game Development', value: 'Game Development' },
    { label: 'Medische informatica', value: 'Medische informatica' },
    { label: 'Communication Professionnelle', value: 'Communication Professionnelle' },
    { label: 'Professional Communication', value: 'Professional Communication' },
    
  ],
  'Extra': [
    { label: 'Gaming', value: 'Gaming' },
    { label: 'Memes', value: 'Memes' },
    { label: 'NFSW', value: 'NFSW' },
  ],
};
client.once('ready', async () => {
  const channel = client.channels.cache.get(roleChannel); // Replace with your channel ID
  if (!channel) return console.error('Kanaal niet gevonden');

  // Fetch the last 10 messages from the channel to check for an existing embed
  const messages = await channel.messages.fetch({ limit: 10 });
  const existingEmbedMessage = messages.find(msg => 
    msg.author.id === client.user.id && 
    msg.embeds[0]?.title === 'Vakrollen opnemen'
  );

  // If an existing embed is found, use it, otherwise send a new one
  if (existingEmbedMessage) {
    console.log(chalk.green('Er bestaat al een interface voor rollen, we hergebruiken deze.'));
    client.categoryMessageId = existingEmbedMessage.id;
  } else {
    const embed = new MessageEmbed()
      .setColor('00cb9c')
      .setThumbnail('https://i.imgur.com/mwYSgFI.png')
      .setTitle('Vakrollen opnemen')
      .addFields(
        {
          name: 'Hoe neem ik vakken op?',
          value:
            '1. Je kan vakken opnemen door onder dit bericht het jaar te selecteren waarin je vakken wilt opnemen.\n2. Daarna zal de bot je vragen voor welk semester je vakken wilt opnemen.\n3. Je kan in het volgende menu meerdere vakken selecteren om op te nemen.',
        },
        {
          name: 'Hoe kan ik vakken verwijderen?',
          value:
            'Je kan vakrollen verwijderen door simpelweg hetzelfde te doen als bij het opnemen van de vakken. Je zal opgenomen vakken herkennen aan de vinkjes en de niet-opgenomen vakken aan kruisjes.',
        },
        {
          name: 'Problemen?',
          value:
            'Maak een ticket aan in <#1290295977403617341> en we helpen je zo snel mogelijk verder!',
        }
      );

  const row = new MessageActionRow()
    .addComponents(
      new MessageSelectMenu()
        .setCustomId('category')
        .setPlaceholder('Selecteer je gewenste categorie')
        .addOptions(Object.keys(roleOptions).map(category => ({
          label: category,
          value: category,
        }))),
    );

  channel.send({ embeds: [embed], components: [row] })
    .then(message => {
      client.categoryMessageId = message.id; // Store the message ID for later editing
    })
    .catch(console.error);
}});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isSelectMenu()) return;

  // Handle category selection
  if (interaction.customId === 'category') {
    const category = interaction.values[0];
  
    // Check if the category is "Keuzevakken" or "Extra"
    if (category === 'Keuzevakken' || category === 'Extra') {
      const roles = roleOptions[category];
  
      const embed = new MessageEmbed()
        .setColor('00cb9c')
        .setTitle(`Selecteer rollen in ${category}`)
        .setDescription('Kies je keuzevakken die je wil opnemen, dit zijn alleen de vakken waar verder nergens een kanaal voor bestaat.');
  
      const roleOptionsWithCheckmarks = roles.map(role => {
        const roleObj = interaction.guild.roles.cache.find(r => r.name === role.value);
        const hasRole = roleObj && interaction.member.roles.cache.has(roleObj.id);
        return {
          label: hasRole ? `✅ ${role.label}` : `❌ ${role.label}`,
          value: role.value,
        };
      });
  
      const row = new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId(`roles-${category}`) // Change the custom ID for roles to only include the category
            .setPlaceholder('Selecteer gewenste rollen')
            .addOptions(roleOptionsWithCheckmarks)
            .setMinValues(0)
            .setMaxValues(roleOptionsWithCheckmarks.length)
        );
  
      // Edit the original category message to reset the dropdown placeholder
      const originalMessage = await interaction.channel.messages.fetch(client.categoryMessageId);
      if (originalMessage) {
        const resetRow = new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('category')
              .setPlaceholder('Selecteer je categorie') // Reset the placeholder here
              .addOptions(Object.keys(roleOptions).map(category => ({
                label: category,
                value: category,
              }))),
          );
  
        // Update the original message with the reset placeholder
        await originalMessage.edit({ components: [resetRow] });
      }
  
      // Send the roles selection as a reply
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } else {
      // Proceed with subcategory selection for other categories
      const subcategories = Object.keys(roleOptions[category]);
  
      const embed = new MessageEmbed()
        .setColor('00cb9c')
        .setTitle(`Je hebt de categorie ${category} gekozen`)
        .setDescription('Kies in welk semester je vakken wil opnemen.');
  
      const row = new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId(`subcategory-${category}`)
            .setPlaceholder('Selecteer je semester')
            .addOptions(subcategories.map(subcategory => ({
              label: subcategory,
              value: subcategory,
            }))),
        );
  
      // Edit the original category message to reset the dropdown placeholder
      const originalMessage = await interaction.channel.messages.fetch(client.categoryMessageId);
      if (originalMessage) {
        const resetRow = new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('category')
              .setPlaceholder('Selecteer je gewenste categorie') // Reset the placeholder here
              .addOptions(Object.keys(roleOptions).map(category => ({
                label: category,
                value: category,
              }))),
          );
  
        // Update the original message with the reset placeholder
        await originalMessage.edit({ components: [resetRow] });
      }
  
      // Send the subcategory selection as a reply
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  }

  // Handle subcategory selection
  else if (interaction.customId.startsWith('subcategory-')) {
    const category = interaction.customId.split('-')[1];
    const subcategory = interaction.values[0];

    const roles = roleOptions[category][subcategory];
    const member = interaction.guild.members.cache.get(interaction.user.id);

    const embed = new MessageEmbed()
      .setColor('00cb9c')
      .setTitle(`Selecteer vakken in ${subcategory} van het ${category}`)
      .setDescription('Kies de vakken die je wilt opnemen hieronder, je zal toegang krijgen tot deze kanalen.');

    const roleOptionsWithCheckmarks = roles.map(role => {
      const roleObj = interaction.guild.roles.cache.find(r => r.name === role.value);
      const hasRole = roleObj && member.roles.cache.has(roleObj.id);
      return {
        label: hasRole ? `✅ ${role.label}` : `❌ ${role.label}`,
        value: role.value,
      };
    });

    const row = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId(`roles-${category}-${subcategory}`) // Keep the same custom ID for subcategory selection
          .setPlaceholder('Selecteer vakken')
          .addOptions(roleOptionsWithCheckmarks)
          .setMinValues(0)
          .setMaxValues(roleOptionsWithCheckmarks.length)
      );

    await interaction.update({ embeds: [embed], components: [row] });
  }

  // Handle role selection
  else if (interaction.customId.startsWith('roles-')) {
    const [_, category, subcategory] = interaction.customId.split('-');
    const selectedRoles = interaction.values;
    const member = interaction.guild.members.cache.get(interaction.user.id);

    const addedRoles = [];
    const removedRoles = [];

    // Update roles
    for (const roleValue of selectedRoles) {
      const role = interaction.guild.roles.cache.find(r => r.name === roleValue);
      if (role) {
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
          removedRoles.push(roleValue);
        } else {
          await member.roles.add(role);
          addedRoles.push(roleValue);
        }
      }
    }

    const overviewEmbed = new MessageEmbed()
  .setColor('GREEN')
  .setTitle('Hier is een overzicht van wat je hebt veranderd:')
  .addField('✅ Toegevoegde Rollen', addedRoles.length > 0 ? addedRoles.join(', ') : 'Geen') // Inline removed or false
  .addField('❌ Verwijderde Rollen', removedRoles.length > 0 ? removedRoles.join(', ') : 'Geen') // Inline removed or false

// Update the interaction with the overview
await interaction.update({ embeds: [overviewEmbed], components: [] });

// After 5 seconds, delete the interaction reply
setTimeout(async () => {
  await interaction.deleteReply().catch(console.error);
}, 5000);
  }
});

client.login(token);
  
