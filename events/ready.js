const chalk = require('chalk');
module.exports = {
  name: 'ready',
  async execute(client) {
    console.log(chalk.blue.bold('        ====> Bot Running...'));

    // Retrieve the channel using the ID from config.
    const oniChan = client.channels.cache.get(client.config.ticketChannel);

    // Function to send the ticket message.
    async function sendTicketMSG() {
      const embed = new client.discord.MessageEmbed()
        .setColor('00cb9c')
        .setAuthor('Zit je met een vraag, opmerking of iets anders?')
        .setDescription('Reageer met 📩 om een ticket te openen!');
      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
            .setCustomId('open-ticket')
            .setLabel('Maak ticket')
            .setEmoji('📩')
            .setStyle('PRIMARY'),
        );

      // Send the message with the embed and components.
      const sentMessage = await oniChan.send({
        embeds: [embed],
        components: [row]
      });

      console.log('De embed message is verstuurd...');
      return sentMessage.id;
    }

    try {
      // Fetch messages from the channel.
      const fetchedMessages = await oniChan.messages.fetch({ limit: 100 });

      // Find the message that is an embed with the specific author.
      const existingMessage = fetchedMessages.find(
        msg => msg.author.id === client.user.id && msg.embeds.length > 0 &&
          msg.embeds[0].author && msg.embeds[0].author.name === 'Zit je met een vraag, opmerking of iets anders?'
      );

      if (existingMessage) {
        const existingMessageId = existingMessage.id;
        console.log(
          chalk.red('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+\n') +
          chalk.green(`Er bestaat al een interface voor de tickets: ${existingMessageId}\n`) +
          chalk.red('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+')
        );
        
      } else {
        await oniChan.bulkDelete(100);
        await sendTicketMSG();
      }
    } catch (error) {
      console.error('Er is een fout opgetreden bij het ophalen van berichten of het verzenden van de embed:', error);
    }
  },
};
