import Head from "next/head";
import dynamic from "next/dynamic";

const WhatIsOso = dynamic(() => import("../src/WhatIsOso"), { ssr: false });

export default function Home() {
  return (
    <div className="p-5" style={{ paddingLeft: "250px" }}>
      <div className="max-w-3xl pt-20">
        <h1 className="text-2xl font-bold mb-2">What do you get from Oso?</h1>
        <p className="mb-2">
          Oso gives you a policy language to control who can do what in your
          applications. The policy uses your existing application data to make
          decisions.
        </p>
        <p className="mb-2">
          Here we have an example app, a Github clone. The policy on the left
          controls what data and actions are available on the right.
        </p>
        <p className="mb-2">
          Try changing the policy and look at what permissions are granted to
          different users.
        </p>
        <div className="mb-10" />
      </div>
      <WhatIsOso />
    </div>
  );
}
