# BrandAssoc_FHE

A privacy-preserving cross-media brand association study platform that enables multiple media outlets to collaboratively analyze brand perception in a fully encrypted environment. The platform leverages Fully Homomorphic Encryption (FHE) to securely aggregate user responses, ensuring that individual participants remain anonymous while providing actionable insights for advertisers and researchers.

## Project Background

Measuring brand perception across multiple media channels faces several critical challenges:

• Privacy concerns: Users may be reluctant to answer surveys due to fear of exposure
• Data siloing: Individual media platforms cannot share raw user data due to privacy regulations
• Inaccurate aggregation: Centralized aggregation risks revealing sensitive user information
• Limited insights: Traditional methods struggle to compute multi-platform association metrics accurately

BrandAssoc_FHE addresses these challenges by:

• Allowing encrypted data submission from multiple media platforms
• Performing secure aggregation using FHE, preserving user anonymity
• Computing brand association networks and statistical metrics without decrypting individual responses
• Providing researchers with trustworthy, privacy-compliant insights

## Features

### Core Functionality

• **Encrypted Survey Submission**: Users submit responses securely across multiple platforms.
• **Brand Association Network Analysis**: Aggregated analysis of user responses to generate brand association graphs.
• **Cross-Media Aggregation**: Combines data from different media outlets securely using FHE.
• **Real-Time Insights**: Dashboards display anonymized aggregated metrics instantly.
• **Anonymous Participation**: Users remain fully anonymous across all platforms.

### Privacy & Security

• **Client-Side Encryption**: Responses are encrypted before leaving the user device.
• **Fully Homomorphic Encryption (FHE)**: Enables computation over encrypted data without exposing raw inputs.
• **Immutable Aggregation Records**: Aggregated metrics cannot be tampered with once computed.
• **Anonymity by Design**: No personally identifiable information is stored or transmitted.

### Analytics & Visualization

• **Association Graphs**: Visualize how users connect brands in their perception networks.
• **Sentiment Metrics**: Evaluate positive, neutral, and negative associations in encrypted form.
• **Cross-Platform Comparison**: Aggregate insights from multiple media without exposing raw platform data.
• **Custom Reports**: Generate encrypted, verifiable summaries for research and advertising teams.

## Architecture

### Backend & Computation

• **FHE Engine**: Performs secure computations on encrypted survey data.
• **Encrypted Storage**: Stores responses and aggregation results in encrypted format.
• **Aggregation Pipelines**: Real-time and batch processing of encrypted submissions for network analysis.

### Frontend Application

• **Survey Interface**: React-based, mobile-optimized user input interface.
• **Data Encryption**: Ensures all responses are encrypted client-side before transmission.
• **Visualization Dashboard**: Displays anonymized association networks and aggregated metrics.
• **Responsive Design**: Seamless experience across devices.

### Technology Stack

#### Encryption & Computation

• FHE Libraries: Enable secure computations over encrypted responses.
• Aggregation Algorithms: Optimized for multi-platform survey data.

#### Frontend

• React 18 + TypeScript: Modern interactive UI
• Charting Libraries: Network graphs and metric visualizations
• Tailwind CSS: Clean and responsive styling

#### Backend

• Node.js + Express: Handles submission, aggregation, and encrypted storage
• PostgreSQL / Encrypted Database: Secure storage for encrypted responses
• WebSocket: Real-time updates to dashboards

## Installation

### Prerequisites

• Node.js 18+
• npm / yarn / pnpm package manager
• Modern browser with WebAssembly support (for client-side FHE)

### Setup

1. Clone the repository and install dependencies
2. Configure environment variables for database and encryption keys
3. Start backend and frontend servers
4. Open the survey interface in a browser to submit and visualize encrypted responses

## Usage

• **Submit Responses**: Users complete surveys via a secure encrypted interface
• **View Aggregated Metrics**: Dashboards show encrypted network analysis results
• **Filter & Explore**: Explore brand associations across different media platforms
• **Generate Reports**: Obtain anonymized summaries for research or marketing purposes

## Security Features

• **End-to-End Encryption**: Data is encrypted from client to server
• **FHE-Based Computation**: Aggregation and analysis performed without decrypting individual inputs
• **Immutable Records**: Aggregated metrics are tamper-proof once computed
• **Anonymity by Design**: Full protection of user identity and platform-specific data

## Future Enhancements

• Multi-platform integration for real-time brand perception updates
• AI-assisted sentiment analysis on encrypted responses
• Threshold alerts for sudden shifts in brand associations
• Mobile app interface for direct encrypted survey submissions
• Community-driven research collaboration tools

Built with ❤️ to enable secure, privacy-first cross-media brand analysis.
