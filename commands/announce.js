const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Stuur een aankondiging naar een specifiek kanaal')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Kanaal waar de aankondiging naartoe moet worden gestuurd')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('De boodschap die je wilt aankondigen')
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    // Check if the user has the required role
    if (!interaction.member.roles.cache.some(role => role.id === client.config.roleSupport)) {
      return interaction.reply({ content: 'Je hebt geen rechten om dit commando uit te voeren!', ephemeral: true });
    }

    // Send the message to the specified channel
    try {
      await channel.send(message);
      await interaction.reply({ content: `Aankondiging succesvol verzonden naar ${channel}.`, ephemeral: true });
      setTimeout(() => {
        interaction.deleteReply();
      }, 5000);
    } catch (error) {
      console.error('Error sending announcement:', error);
      await interaction.reply({ content: 'Er is een fout opgetreden bij het verzenden van de aankondiging.', ephemeral: true });
    }
  },
};
