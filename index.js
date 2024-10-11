// Import necessary modules
const fs = require('fs'); // File system module for reading command and event files
const { Client, Collection, Intents } = require('discord.js'); // Discord.js for interacting with the Discord API
const chalk = require('chalk'); // Chalk for coloring console output
const config = require('./config.json'); // Load configuration settings from config.json

// Create a new Discord client instance with specified intents
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS, // Enables Guild-related events
    Intents.FLAGS.GUILD_MESSAGES, // Enables message-related events in guilds
    Intents.FLAGS.GUILD_MEMBERS // Enables member-related events in guilds
  ],
});

// Add the Discord and config modules to the client for easy access
const Discord = require('discord.js'); 
client.discord = Discord; // Attach Discord.js to the client
client.config = config; // Attach the config to the client

// Create a new Collection to hold commands
client.commands = new Collection(); 

// Read command files from the commands directory

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Loop through each command file and load it
for (const file of commandFiles) {
  const command = require(`./commands/${file}`); // Import the command module
  client.commands.set(command.data.name, command); // Add the command to the commands Collection
};

// Read event files from the events directory
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

// Loop through each event file and register it
for (const file of eventFiles) {
  const event = require(`./events/${file}`); // Import the event module
  // Set up the event listener and execute the event's execute function
  client.on(event.name, (...args) => event.execute(...args, client));
};



// When the client is ready, set the activity status
client.once('ready', () => {
  client.user.setActivity('mouse clicks', { type: 'LISTENING' });
 // Set the bot's activity to 'WATCHING tickets'
});

// Handle command interactions from users
client.on('interactionCreate', async interaction => {
  // Check if the interaction is a command
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName); // Get the command from the commands Collection
  if (!command) return; // If command not found, exit

  try {
    // Execute the command with the interaction and client as arguments
    await command.execute(interaction, client, config);
  } catch (error) {
    console.error(error); // Log the error to the console
    // Respond to the interaction with an error message
    return interaction.reply({
      content: 'Er is een fout opgetreden! Probeer het later opnieuw.', // Error message in Dutch
      ephemeral: true // Makes the reply visible only to the user
    });
  }
});
// Log in to Discord with the token from config.json
client.login(require('./config.json').token);
