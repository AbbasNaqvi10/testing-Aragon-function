import {
  Client,
  CreateDaoParams,
  DaoCreationSteps,
  DaoMetadata,
  GasFeeEstimation,
  TokenVotingPluginInstall,
  AddresslistVotingPluginInstall,
  TokenVotingClient,
  AddresslistVotingClient,
  VotingMode,
} from "@aragon/sdk-client";
import { context } from "./Context";
import axios from "axios";

export const CreateDao = async () => {
  // Instantiate the general purpose client from the Aragon OSx SDK context.
  const client: Client = new Client(context);

  const metadata: DaoMetadata = {
    name: "My DAO",
    description: "This is a description",
    avatar: "image-url",
    links: [
      {
        name: "Web site",
        url: "https://google.com",
      },
    ],
  };

  const formData = new FormData();

  formData.append("pinataMetadata", JSON.stringify(metadata));

  // Through pinning the metadata in IPFS, we can get the IPFS URI. You can read more about it here: https://docs.ipfs.tech/how-to/pin-files/

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    metadata,
    {
      headers: {
        "Content-Type": `application/json`,
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1YjU1ODg4OC1iNWY5LTQzNzUtYmFkMC0yN2JiZmM2ODBjNmIiLCJlbWFpbCI6ImFiYmFzbmFxdmlAZGVjaGFpbnMuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImIxOGMxYTg1ZmJjMzljNzU4NzgyIiwic2NvcGVkS2V5U2VjcmV0IjoiMzgxMjI0ZDY0MjljNmIyNDljNDdlN2M3NTA4YjFmZTE2NjhhNjNjZGM3ZDU0MmQ5ZmY2Mjk4YWU1MmJlNDA1YyIsImlhdCI6MTY4NDMyNTI1NH0.0DiBxrBDhVnwcuO5iWIZWS-8infoHaw-s1nLdFt_ul8",
      },
    }
  );
  console.log(res.data);

  const metadataUri = res.data.IpfsHash;
  // const metadataUri = await client.methods.pinMetadata(metadata);
  // console.log("metadataUri: ", metadataUri);

  // You need at least one plugin in order to create a DAO. In this example, we'll use the TokenVoting plugin, but feel free to install whichever one best suites your needs. You can find resources on how to do this in the plugin sections.
  // These would be the plugin params if you need to mint a new token for the DAO to enable TokenVoting.

  const addressVotingPlugin : AddresslistVotingPluginInstall ={
    addresses : ["0x6c844CAdCd636130397f3d44796045d8BB4A70Dc".toLowerCase()],
    votingSettings: {
      minDuration: 60 * 60 * 24 * 2, // seconds
      minParticipation: 0.25, // 25%
      supportThreshold: 0.5, // 50%
      minProposerVotingPower: BigInt("5000"), // default 0
      votingMode: VotingMode.EARLY_EXECUTION, // default is STANDARD. other options: EARLY_EXECUTION, VOTE_REPLACEMENT
    }
  }

  // const pluginInitParams: TokenVotingPluginInstall = {
  //   votingSettings: {
  //     minDuration: 60 * 60 * 24 * 2, // seconds
  //     minParticipation: 0.25, // 25%
  //     supportThreshold: 0.5, // 50%
  //     minProposerVotingPower: BigInt("5000"), // default 0
  //     votingMode: VotingMode.EARLY_EXECUTION, // default is STANDARD. other options: EARLY_EXECUTION, VOTE_REPLACEMENT
  //   },
  //   newToken: {
  //     name: "Token", // the name of your token
  //     symbol: "TOK", // the symbol for your token. shouldn't be more than 5 letters
  //     decimals: 18, // the number of decimals your token uses
  //     // minter: "0x...", // optional. if you don't define any, we'll use the standard OZ ERC20 contract. Otherwise, you can define your own token minter contract address.
  //     balances: [
  //       {
  //         // Defines the initial balances of the new token
  //         address: "0x6c844CAdCd636130397f3d44796045d8BB4A70Dc", // address of the account to receive the newly minted tokens
  //         balance: BigInt(10), // amount of tokens that address should receive
  //       },
  //     ],
  //   },
  // };

  // Creates a TokenVoting plugin client with the parameteres defined above (with an existing token).
  const tokenVotingPluginToInstall =
  AddresslistVotingClient.encoding.getPluginInstallItem(addressVotingPlugin, "goerli");
  console.log(tokenVotingPluginToInstall);
  const createDaoParams: CreateDaoParams = {
    metadataUri,        
    ensSubdomain: "dechains", // my-org.dao.eth
    plugins: [tokenVotingPluginToInstall], // plugin array cannot be empty or the transaction will fail. you need at least one governance mechanism to create your DAO.
  };
  console.log("before gas");
  // Estimate how much gas the transaction will cost.
  const estimatedGas: GasFeeEstimation = await client.estimation.createDao(
    createDaoParams
    );
  console.log({ avg: estimatedGas.average, maximum: estimatedGas.max });

  // Create the DAO.
  const steps = client.methods.createDao(createDaoParams);
  console.log("afgter",steps);

  for await (const step of steps) {
    try {
      console.log(step)
      switch (step.key) {
        case DaoCreationSteps.CREATING:
          console.log(step.txHash);
          break;
        case DaoCreationSteps.DONE:
          console.log(step.address);
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
};
