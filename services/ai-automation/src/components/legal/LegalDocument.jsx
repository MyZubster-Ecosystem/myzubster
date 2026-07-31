import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const LegalDocument = () => {
  const { doc } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docMap = {
      'terms': 'TERMS_OF_SERVICE.md',
      'privacy': 'PRIVACY_POLICY.md',
      'cookies': 'COOKIE_POLICY.md',
      'refund': 'REFUND_DISPUTE_POLICY.md',
      'cla': 'CONTRIBUTOR_LICENSE_AGREEMENT.md',
      'dpa': 'DATA_PROCESSING_AGREEMENT.md',
      'gdpr': 'GDPR_COMPLIANCE_CHECKLIST.md',
      'ip': 'IP_POLICY.md',
      'sensitive-data': 'SENSITIVE_DATA_CONSENT_FORM.md',
      'crypto': 'CRYPTO_TRANSACTION_TERMS.md'
    };

    const fileName = docMap[doc];
    if (fileName) {
      fetch(`/legal/${fileName}`)
        .then(res => res.text())
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [doc]);

  if (loading) {
    return <div className="loading">Loading document...</div>;
  }

  if (!content) {
    return <div className="error">Document not found</div>;
  }

  return (
    <div className="legal-document">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default LegalDocument;
