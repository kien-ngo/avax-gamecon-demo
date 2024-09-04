"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { toast, useToast } from "@/hooks/use-toast";
import { ClaimButton, ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/thirdwebClient";
import { getContract, Hex } from "thirdweb";
import { avalanche, avalancheFuji } from "thirdweb/chains";
import Link from "next/link";

const GRID_SIZE = 10;
const CELL_SIZE = 40;

type Position = { x: number; y: number };

// Default forwarders
// ["0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81","0x6271Ca63D30507f2Dcbf99B52787032506D75BBF"]

const contract = getContract({
	address: "0x433F419A34D3B6ffCCb0fe3A736c8e88DB8a7363",
	chain: avalancheFuji,
	client,
});

export function Game() {
	const [gameStarted, setGameStarted] = useState(false);
	const [playerPosition, setPlayerPosition] = useState<Position>({
		x: 0,
		y: 0,
	});
	const [targetPosition, setTargetPosition] = useState<Position>({
		x: 0,
		y: 0,
	});
	const [showRewardModal, setShowRewardModal] = useState(false);
	const [moves, setMoves] = useState(0);
	const { toast } = useToast();

	const startGame = () => {
		setGameStarted(true);
		setPlayerPosition({ x: 0, y: 0 });
		setTargetPosition({
			x: Math.floor(Math.random() * GRID_SIZE),
			y: Math.floor(Math.random() * GRID_SIZE),
		});
		setMoves(0);
	};

	const account = useActiveAccount();

	const movePlayer = useCallback(
		(dx: number, dy: number) => {
			if (!gameStarted) return;

			setPlayerPosition((prev) => {
				const newPos = {
					x: Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx)),
					y: Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy)),
				};
				setMoves((moves) => moves + 1);
				if (newPos.x === targetPosition.x && newPos.y === targetPosition.y) {
					setShowRewardModal(true);
					setGameStarted(false);
				}
				return newPos;
			});
		},
		[gameStarted, targetPosition],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			switch (e.key) {
				case "ArrowUp":
					movePlayer(0, -1);
					break;
				case "ArrowDown":
					movePlayer(0, 1);
					break;
				case "ArrowLeft":
					movePlayer(-1, 0);
					break;
				case "ArrowRight":
					movePlayer(1, 0);
					break;
			}
		},
		[movePlayer],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	return (
		<div className="flex flex-col items-center justify-center p-4">
			{account && (
				<div className="mb-20">
					<ConnectButton
						client={client}
						supportedNFTs={{
							[avalancheFuji.id]: [contract.address as Hex],
							[avalanche.id]: ["0xCD4C4726c74436B28E6Af18aD84C63cA457c9273"],
						}}
					/>
				</div>
			)}
			<div className="w-full max-w-md space-y-4">
				{!account ? (
					<ConnectButton
						connectButton={{ style: { width: "100%" } }}
						client={client}
					/>
				) : !gameStarted ? (
					<Button onClick={startGame} className="w-full">
						Start Game
					</Button>
				) : (
					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-center">
							Move to the Target
						</h2>
						<p className="text-center">
							Use arrow keys to move. Moves: {moves}
						</p>
						<div
							className="relative"
							style={{
								width: `${GRID_SIZE * CELL_SIZE}px`,
								height: `${GRID_SIZE * CELL_SIZE}px`,
								backgroundColor: "#f0f0f0",
								border: "2px solid #333",
							}}
						>
							<div
								className="absolute bg-blue-500"
								style={{
									width: `${CELL_SIZE - 2}px`,
									height: `${CELL_SIZE - 2}px`,
									left: `${playerPosition.x * CELL_SIZE + 1}px`,
									top: `${playerPosition.y * CELL_SIZE + 1}px`,
									transition: "all 0.1s",
								}}
							/>
							<div
								className="absolute bg-red-500"
								style={{
									width: `${CELL_SIZE - 2}px`,
									height: `${CELL_SIZE - 2}px`,
									left: `${targetPosition.x * CELL_SIZE + 1}px`,
									top: `${targetPosition.y * CELL_SIZE + 1}px`,
								}}
							/>
						</div>
					</div>
				)}
			</div>

			<Dialog open={showRewardModal} onOpenChange={setShowRewardModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Congratulations!</DialogTitle>
						<DialogDescription>
							You've reached the target in {moves} moves!
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<ClaimButton
							contractAddress={contract.address}
							chain={contract.chain}
							client={contract.client}
							claimParams={{ type: "ERC1155", tokenId: 1n, quantity: 1n }}
							onTransactionSent={() => {
								toast({
									title: "Reward Claimed!",
									description: `Congratulations! You reached the target in ${moves} moves.`,
								});
								setShowRewardModal(false);
							}}
						>
							Claim rewards
						</ClaimButton>
						{/* <Button onClick={claimReward}>Claim Reward</Button> */}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Link href={"/buy"} className="mt-20 underline">
				Buy Game item
			</Link>
		</div>
	);
}
