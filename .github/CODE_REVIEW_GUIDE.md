# Code Review Guide

## Purpose
- Quality - Bugs are caught early
- Consistency - Code follows standards
- Knowledge - Everyone learns
- Security - Vulnerabilities are found

## What to Look For

### Functionality
- Correctness
- Edge Cases
- Error Handling
- Validation

### Code Quality
- Readability
- Naming
- Comments
- Structure

### Design
- Patterns
- Separation of Concerns
- DRY
- SOLID

### Testing
- Coverage
- Quality
- Integration

### Performance
- Efficiency
- Resources
- Scale

### Security
- Input sanitization
- Authentication
- Authorization
- Data protection

## Review Comments

### Good Examples
- Consider using map instead of forEach here for better readability.
- This function is doing too much. Could we split it into smaller functions?
- Great approach! This solves the problem elegantly.

### Bad Examples
- This is wrong.
- Fix this.
- I don't like this.

### Constructive Feedback Format
- What: What needs to change
- Why: Why it should change
- How: How to change it
- Example: Example code if needed

## Review Process

### Step 1: First Pass
1. Read the description
2. Check the issue
3. Overview
4. Quick wins

### Step 2: Detailed Review
1. Line by line
2. Think like the author
3. Test mentally
4. Check tests

### Step 3: Summary
1. Overall assessment
2. Major issues
3. Minor issues
4. Recommendation

## Review Outcomes

- Approve: All good, merge
- Request Changes: Issues need fixing
- Comment: Questions or suggestions

## Review Metrics

- Review Time: Good < 24h, Needs Improvement > 48h
- PR Size: Good < 200 lines, Needs Improvement > 500 lines
- Comments/PR: Good 3-10, Needs Improvement 0 or > 20
- Time to Merge: Good < 48h, Needs Improvement > 1 week

Remember: We're all here to build something great together. Be kind, be constructive, and always keep learning.
