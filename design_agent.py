
import asyncio
import json
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

async def main():
    # Load design skill
    with open("/home/user/app/skills/frontend_design.md", "r") as f:
        design_skill = f.read()

    options = ClaudeAgentOptions(
        system_prompt={
            "type": "preset",
            "preset": "claude_code",
            "append": design_skill
        },
        permission_mode="acceptEdits",
        allowed_tools=["Read", "Write", "Glob"],
        cwd="/home/user/app",
        model="claude-sonnet-4-5-20250929",
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query(
            "Analyze app_metadata.json and create a comprehensive design_spec.json. "
            "Be creative and domain-specific. Avoid convergent defaults like Inter, Space Grotesk, purple gradients."
        )

        async for _ in client.receive_response():
            pass  # Wait for completion

if __name__ == "__main__":
    asyncio.run(main())
