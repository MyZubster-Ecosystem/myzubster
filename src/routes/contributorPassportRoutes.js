const express = require('express');
const { getContributorPassport } = require('../services/contributorPassportService');

const router = express.Router();

router.get('/:authorId/passport', async (req, res) => {
  try {
    const passport = await getContributorPassport(
      String(req.params.authorId)
    );

    return res.json({
      success: true,
      passport
    });

  } catch (error) {
    return res.status(500).json({
      success:false,
      error:error.message
    });
  }
});

module.exports = router;
