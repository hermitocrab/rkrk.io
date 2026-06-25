import edge_tts
import asyncio
import os

AUDIO_DIR = "/Users/agentii/dev/rkrk.io/langcert/listening/homework/audio"

diagrams = {
    "l1": {
        "title": "Morning Routine",
        "lines": [
            ("Jenny", "Good morning! Did you sleep well?"),
            ("Guy",   "Yes, I did. I woke up at seven."),
            ("Jenny", "That's early. Do you eat breakfast?"),
            ("Guy",   "Yes, I have tea and bread."),
            ("Jenny", "I just have coffee. Then I take a shower."),
            ("Guy",   "Me too. Then I go to school."),
            ("Jenny", "What time do you leave?"),
            ("Guy",   "I leave at eight."),
        ]
    },
    "l2": {
        "title": "Weekend Plans",
        "lines": [
            ("Jenny", "Are you free this weekend?"),
            ("Guy",   "Yes, I am. What do you want to do?"),
            ("Jenny", "Maybe we can watch a movie?"),
            ("Guy",   "Actually, I want to go to the park."),
            ("Jenny", "The park? That sounds nice."),
            ("Guy",   "The weather is good. We can have lunch there."),
            ("Jenny", "Good idea. What time should we meet?"),
            ("Guy",   "How about twelve o'clock?"),
            ("Jenny", "Okay. See you at the park at twelve."),
            ("Guy",   "See you then!"),
        ]
    },
    "l3": {
        "title": "At a Restaurant",
        "lines": [
            ("Guy",   "Here is the menu. What do you want?"),
            ("Jenny", "I'm not sure. What looks good?"),
            ("Guy",   "I want the chicken and rice."),
            ("Jenny", "That sounds nice, but I don't eat meat."),
            ("Guy",   "Actually, they also have fish."),
            ("Jenny", "Okay, I will have the fish."),
            ("Guy",   "What do you want to drink?"),
            ("Jenny", "Just water, please."),
            ("Guy",   "Me too. Can we have the bill after?"),
            ("Jenny", "Yes, of course."),
            ("Guy",   "Excuse me, can we have the bill?"),
            ("Jenny", "Thank you. The food was good."),
        ]
    },
    "l4": {
        "title": "Asking for Directions",
        "lines": [
            ("Jenny", "Excuse me, where is the train station?"),
            ("Guy",   "It is not far. Go straight down this road."),
            ("Jenny", "Straight down this road?"),
            ("Guy",   "Yes. Then turn left at the supermarket."),
            ("Jenny", "Left at the supermarket. Okay."),
            ("Guy",   "After that, you will see a big church."),
            ("Jenny", "Is the station near the church?"),
            ("Guy",   "Yes, it is. Actually, it is behind the church."),
            ("Jenny", "So I go straight, turn left, and it is behind the church?"),
            ("Guy",   "That's right. You can also take a bus."),
            ("Jenny", "I think I will walk. Thank you."),
            ("Guy",   "You're welcome. Have a nice day."),
            ("Jenny", "Thanks, you too."),
            ("Guy",   "Bye!"),
        ]
    },
    "l5": {
        "title": "Talking About Hobbies",
        "lines": [
            ("Guy",   "What do you do in your free time?"),
            ("Jenny", "I like to play the guitar. Do you play?"),
            ("Guy",   "No, but I want to learn. Is it hard?"),
            ("Jenny", "It is hard at first, but you get better."),
            ("Guy",   "How long have you played?"),
            ("Jenny", "About two years. I practice every day."),
            ("Guy",   "That is a lot. What else do you like?"),
            ("Jenny", "I also like reading. Books are fun."),
            ("Guy",   "I prefer video games, actually."),
            ("Jenny", "Because they are more exciting?"),
            ("Guy",   "Yes, and I can play with my friends."),
            ("Jenny", "That makes sense. Maybe I should try."),
            ("Guy",   "You should! I can show you some games."),
            ("Jenny", "Okay, that sounds fun."),
            ("Guy",   "Great! Let's play this weekend."),
            ("Jenny", "I'm looking forward to it."),
        ]
    },
}

VOICES = {
    "Jenny": "en-US-JennyNeural",
    "Guy": "en-US-GuyNeural",
}

async def gen_line(lesson, idx, speaker, text):
    voice = VOICES[speaker]
    fname = f"{lesson}_line{idx+1}.mp3"
    fpath = os.path.join(AUDIO_DIR, fname)
    
    # Slow down rate for A2 learners: -20% speed
    communicate = edge_tts.Communicate(
        text, voice,
        rate="-20%"
    )
    await communicate.save(fpath)
    print(f"  ✓ {fname}: {speaker}: {text}")
    return fname, text

async def gen_full(lesson, lines_with_speakers):
    """Generate single full dialogue audio with JennyNeural."""
    fname = f"{lesson}_full.mp3"
    fpath = os.path.join(AUDIO_DIR, fname)
    full_text = "\n".join(text for _, text in lines_with_speakers)
    communicate = edge_tts.Communicate(
        full_text, "en-US-JennyNeural",
        rate="-20%"
    )
    await communicate.save(fpath)
    print(f"  ✓ full dialogue: {fname}")

async def main():
    for lesson, data in diagrams.items():
        title = data["title"]
        lines = data["lines"]
        print(f"\n🎙️ {lesson}: {title} ({len(lines)} lines)")
        
        # Generate per-line audio
        tasks = []
        for i, (speaker, text) in enumerate(lines):
            tasks.append(gen_line(lesson, i, speaker, text))
        results = await asyncio.gather(*tasks)
        
        # Generate full dialogue audio
        await gen_full(lesson, lines)
        
        # Count
        print(f"  ✅ {lesson}: {len(results)} line files + 1 full file generated")

    print("\n✨ All audio generated!")

asyncio.run(main())
