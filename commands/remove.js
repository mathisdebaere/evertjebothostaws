const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Verwijder iemand uit een ticket')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Gebruiker die je wilt verwijderen')
        .setRequired(true)),
  async execute(interaction, client) {
    const chan = client.channels.cache.get(interaction.channelId);
    const user = interaction.options.getUser('target');

    if (!interaction.member.roles.cache.find(r => r.id === client.config.roleSupport)) {
      return interaction.reply({ content: "Je bent niet gemachtigd om dit commando uit te voeren!", ephemeral: true });
    }

    // Check if the command is used in a ticket channel
    if (chan.name.includes('ticket')) {
      // **CHANGED**: Get the current permission overwrites and store them
      const currentOverwrites = chan.permissionOverwrites.cache.map(overwrite => ({
        id: overwrite.id,
        allow: overwrite.allow.bitfield,
        deny: overwrite.deny.bitfield,
      }));

      const userOverwriteIndex = currentOverwrites.findIndex(overwrite => overwrite.id === user.id);
      if (userOverwriteIndex !== -1) {
      
        currentOverwrites.splice(userOverwriteIndex, 1); 
      }
      chan.edit({
        permissionOverwrites: currentOverwrites
      }).then(async () => {
        interaction.reply({
          content: `<@${user.id}> is verwijderd uit de ticket!`
        });
      }).catch(err => {
        console.error(err);
        interaction.reply({
          content: 'Er is een fout opgetreden bij het verwijderen van de gebruiker uit het ticket.',
          ephemeral: true
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
