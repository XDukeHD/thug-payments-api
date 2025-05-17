> ⚠️ **Warning**: Thug-main branch is where the system fetches updates when recent changes are made. Unlike the official branch, this one includes additional tools and handles different situations. It features a stable connection to the Thug database for checking user plans, expiration dates, and more. This system can be used by others as long as it is adapted to their primary system or environment. However, we do not provide support for any code based on the thug-main branch — support is only available for the official branch. Other branches are also not eligible for my assistance.


# Thug Payments API

A secure and efficient payment processing API built on top of PagBank's payment infrastructure.

## Overview

Thug Payments API is a comprehensive payment gateway solution that integrates with PagBank to process various types of payments, with special focus on PIX payments (instant Brazilian payment system). The API securely manages payment transactions, tracks statuses, and provides detailed reporting.

## Key Features

- Secure API access with system_key authentication
- PagBank integration for reliable payment processing
- Multiple payment methods support, including PIX
- SQLite database for efficient transaction recording
- Comprehensive payment status system (PAID, PROCESSING, CANCELED)
- User-specific payment tracking
- Webhook support for payment status updates

## Getting Started

1. Clone this repository
2. Copy `config.example.json` to `config.json` and update with your credentials
3. Install dependencies with `npm install`
4. Start the server with `npm start` (or `npm run dev` for development)

## Documentation

For detailed documentation on API endpoints, request/response formats, and integration guides, please see the [docs](/docs) directory. Documentation is available in both English and Portuguese.

## Requirements

- Node.js 14+
- NPM or Yarn
- PagBank API credentials

## License

MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your changes. Ensure that your code adheres to the project's coding standards and includes appropriate tests.

## Support
For support, please open an issue on the GitHub repository or contact the author directly.

## Author

[XDuke - Túlio Cadilhac](https://github.com/XDukeHD/)