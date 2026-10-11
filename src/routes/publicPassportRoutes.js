const express = require('express');

const {
  getPublicKnowledgePassport
} = require('../services/publicPassportService');

const router = express.Router();


router.get(
  '/:contributorId',
  async (req, res) => {

    try {

      const passport =
        await getPublicKnowledgePassport(
          req.params.contributorId
        );

      return res.json({
        success: true,
        passport
      });

    } catch (error) {

      console.error(
        '[PublicPassport]',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Unable to build public knowledge passport'
      });
    }
  }
);


module.exports = router;
