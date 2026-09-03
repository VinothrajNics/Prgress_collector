CREATE TABLE IF NOT EXISTS risk_responses (
  clientId TEXT NOT NULL DEFAULT '',
  questionId TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  updatedAt TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (clientId, questionId)
);
