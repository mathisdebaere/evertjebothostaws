const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Verwijder een aantal berichten uit het kanaal')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Aantal berichten dat je wilt verwijderen (1-100)')
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const channel = interaction.channel; // Updated to use interaction.channel directly
    const amount = interaction.options.getInteger('amount');

    // Check if the user has the required role
    if (!interaction.member.roles.cache.some(role => role.id === client.config.roleSupport)) {
      return interaction.reply({ content: 'Je hebt geen rechten om dit commando uit te voeren!', ephemeral: true });
    }
    setTimeout(() => {
        interaction.deleteReply().catch(console.error); 
    }, 5000);

    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: 'Het aantal berichten moet tussen 1 en 100 zijn.', ephemeral: true });
    }
    setTimeout(() => {
        interaction.deleteReply().catch(console.error); 
    }, 5000);

    try {
        const fetchedMessages = await channel.messages.fetch({ limit: amount });
        await channel.bulkDelete(fetchedMessages, true);
        const reply = await interaction.reply({ content: `Succesvol ${fetchedMessages.size} berichten verwijderd.`, ephemeral: true });
    

        setTimeout(() => {
            interaction.deleteReply().catch(console.error); 
        }, 5000); 
    
    } catch (error) {
        console.error('Error when trying to delete messages:', error);
        const reply = await interaction.reply({ content: 'Er is een fout opgetreden bij het verwijderen van berichten. Zorg ervoor dat de berichten niet ouder dan 14 dagen zijn.', ephemeral: true });

        setTimeout(() => {
            interaction.deleteReply().catch(console.error); 
        }, 5000);
    }
  },
};
