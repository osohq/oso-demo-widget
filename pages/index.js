import Head from "next/head";
import dynamic from "next/dynamic";

const WhatIsOso = dynamic(() => import("../src/WhatIsOso"), { ssr: false });

export default function Home() {
  return (
    <div className="p-5" style={{ paddingLeft: "250px" }}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">What is Oso?</h1>
        <p className="mb-2">
          Oso lets you write policies that control who can do what in your
          applications. Here we have an example policy and some example data.
        </p>
        <p className="mb-2">
          Try changing the policy used a look at what permissions are granted to
          different users.
        </p>
      </div>
      <WhatIsOso />
    </div>
  );
}
