import { context } from "./utils/Context"
import { Client } from "@aragon/sdk-client";
import { CreateDao } from "./utils/CreateDao";

// Instantiate the general purpose client from the Aragon OSx SDK context.
const client: Client = new Client(context);
console.log({ client });
CreateDao();

function App() {

  return (
    <>
    </>
  )
}

export default App
