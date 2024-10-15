## Configuraton

```json
{
  "clientId": "DISCORD BOT ID",
  "token": "DISCORD BOT TOKEN",

  "parentOpened": "ID VAN TICKET CATEGORIE",
  "Category1": "NAAM EERSTE TICKETCATEGORIE",
  "Category2": "NAAM TWEEDE TICKETCATEGORIE",
  "Category3": "NAAM DERDE TICKETCATEGORIE",

  "guildId": "SERVER ID",

  "welcomeChannel":"ID VAN WELKOM CHANNEL",

  "roleSupport": "ID VAN TICKET SUPPORT ROL",
  
  "verifyChannel": "ID VAN DE VERIFY CHANNEL",

  "graduateRole": "ID VAN DE AFGESTUDEERD ROL",

  "roleChannel": "ID VAN DE ROLLEN CHANNEL",  


"joinToCreateChannelId2":"ID VAN DE ROOMMAKER VOOR 2 PERSONEN",
  "joinToCreateChannelId3":"ID VAN DE ROOMMAKER VOOR 3 PERSONEN",
  "joinToCreateChannelId4":"ID VAN DE ROOMMAKER VOOR 4 PERSONEN",
  "joinToCreateChannelIdUnlimited":"ID VAN DE ROOMMAKER VOOR UNLIMITED PERSONEN",

"roleId": "VERIFIED ROL / STUDENT",
  "email": {
    "user": "xxxxxxxxxxxxxxxxx", //email verificatiecodes
    "pass": "xxxx xxxx xxxx xxxx" //passkeys van deze email
  }, 

  "logsTicket": "ID VOOR TICKET LOGS KANAAL",
  "ticketChannel": "ID VOOR KANAAL WAAR EMBED NAARTOE WORDT GESTUURD OM EEN TICKET TE MAKEN"
}
```
## Deployment

```bash
node commands.js
node index.js
```
