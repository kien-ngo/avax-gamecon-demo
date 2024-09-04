"use client";

import { NftMint } from "@/components/nft-mint";
import { client } from "@/lib/thirdwebClient";
import { getContract, toTokens } from "thirdweb";
import { avalanche } from "thirdweb/chains";
import { getContractMetadata } from "thirdweb/extensions/common";
import {
	getActiveClaimCondition as getActiveClaimCondition1155,
	getNFT,
	isERC1155,
} from "thirdweb/extensions/erc1155";
import { getCurrencyMetadata } from "thirdweb/extensions/erc20";
import {
	getActiveClaimCondition as getActiveClaimCondition721,
	isERC721,
} from "thirdweb/extensions/erc721";
import { useReadContract } from "thirdweb/react";

const contract = getContract({
	address: "0xCD4C4726c74436B28E6Af18aD84C63cA457c9273",
	chain: avalanche,
	client,
});

export default function Home() {
	const tokenId = 0n;
	const { chain } = contract;
	const isERC721Query = useReadContract(isERC721, { contract });
	const isERC1155Query = useReadContract(isERC1155, { contract });
	const contractMetadataQuery = useReadContract(getContractMetadata, {
		contract,
	});
	const nftQuery = useReadContract(getNFT, {
		contract,
		tokenId,
		queryOptions: { enabled: isERC1155Query.data },
	});
	const claimCondition1155 = useReadContract(getActiveClaimCondition1155, {
		contract,
		tokenId,
		queryOptions: {
			enabled: isERC1155Query.data,
		},
	});
	const claimCondition721 = useReadContract(getActiveClaimCondition721, {
		contract,
		queryOptions: { enabled: isERC721Query.data },
	});
	const displayName = isERC1155Query.data
		? nftQuery.data?.metadata.name
		: contractMetadataQuery.data?.name;
	const description = isERC1155Query.data
		? nftQuery.data?.metadata.description
		: contractMetadataQuery.data?.description;
	const priceInWei =
		claimCondition1155.data?.pricePerToken ||
		claimCondition721.data?.pricePerToken;
	const currency =
		claimCondition1155.data?.currency || claimCondition721.data?.currency;
	const currencyContract = getContract({
		address: currency || "",
		chain,
		client,
	});
	const currencyMetadata = useReadContract(getCurrencyMetadata, {
		contract: currencyContract,
		queryOptions: { enabled: !!currency },
	});
	const currencySymbol = currencyMetadata.data?.symbol || "";
	const pricePerToken =
		currencyMetadata.data && priceInWei
			? Number(toTokens(priceInWei, currencyMetadata.data.decimals))
			: null;
	return (
		<NftMint
			contract={contract}
			displayName={displayName || ""}
			contractImage={contractMetadataQuery.data?.image || ""}
			description={description || ""}
			currencySymbol={currencySymbol}
			pricePerToken={pricePerToken}
			isERC1155={!!isERC1155Query.data}
			tokenId={tokenId}
		/>
	);
}
