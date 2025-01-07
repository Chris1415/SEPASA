
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Reference
https://hachweb.wordpress.com/2025/01/07/xm-cloud-uncover-all-the-secrets-of-embedded-personalization/

## Features
- Connect to an XM Cloud instance via Context ID
- Extract all the given Sites and all the given languages and routes per site
- Be able to set dedicated simulation parameter to test personalization
- Get the standard layout response
- Get all components which contain personalizations
- Get a direct compariosn of all components where personalization is applied and see what exactly changes
- Get a detailed step by step log, which illustrates, what is happening during execution

## Limitations
- You can not simulate all the conditions as some of them are automatically transmitted or calculated on server side (Further investigation needed)
- A/B/n Testing is currently not covered as this needs an extension of the logic

## Next Steps
- Add an input for setting your context ID
- Add support for A/B/n Testing to simulate and test this as well
- Check if further conditions can be simulated as well

## Important Note
This is a *fun* and *personal* project. There it is  not officially supported by Sitecore or myself. Use on own risk ;-) 
