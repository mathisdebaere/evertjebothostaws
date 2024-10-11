const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Voeg iemand toe aan een ticket')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Gebruiker die je wilt toevoegen')
        .setRequired(true)),
  async execute(interaction, client) {
    const chan = client.channels.cache.get(interaction.channelId);
    const user = interaction.options.getUser('target');

    if (!interaction.member.roles.cache.find(r => r.id === client.config.roleSupport)) {
      return interaction.reply({ content: "Je bent niet gemachtigd om dit commando uit te voeren!", ephemeral: true });
    }

    if (chan.name.includes('ticket')) {
      
      const currentOverwrites = chan.permissionOverwrites.cache.map(overwrite => ({
        id: overwrite.id,
        allow: overwrite.allow.bitfield,
        deny: overwrite.deny.bitfield
      }));

      
      currentOverwrites.push({
        id: user.id, 
        allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
        deny: []
      });
      chan.edit({
        permissionOverwrites: currentOverwrites
      }).then(async () => {
        interaction.reply({
          content: `<@${user.id}> is toegevoegd aan dit ticket!`
        });
      });
    } else {
      interaction.reply({
        content: 'Deze command werkt alleen in ticket channels!',
        ephemeral: true
      });
    }
  },
};
