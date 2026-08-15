const mongoose = require('mongoose');

const AIContractSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  model: { type: String, required: true }, // es. "deepseek-chat", "gpt-4"
  tokens: { type: Number, required: true }, // milioni di token
  priceMYZ: { type: Number, required: true }, // costo in MYZ
  priceXMR: { type: Number }, // costo in XMR (opzionale)
  deliveryMonth: { type: Date, required: true }, // inizio del mese di consegna
  discount: { type: Number, required: true }, // percentuale di sconto
  status: { type: String, enum: ['active', 'consumed', 'expired', 'listed_for_sale'], default: 'active' },
  consumedTokens: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // fine del mese di consegna
  resalePrice: { type: Number }, // se in vendita
});

module.exports = mongoose.model('AIContract', AIContractSchema);
