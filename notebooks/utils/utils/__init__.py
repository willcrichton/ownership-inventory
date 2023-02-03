import pandas as pd
from pathlib import Path
import json
import tomlkit
import random

QUESTIONS_PATH = (
    Path(__file__).parent / "../../../packages/ownership-inventory/src/problems.toml"
).resolve()

RESPONSES_PATH = (
    Path(__file__).parent / "../../../server/ownership-inventory.log"
)

def load_inventory_questions():
    qs = tomlkit.load(QUESTIONS_PATH.open())
    return pd.DataFrame(qs["problems"])


def load_inventory_responses(log_path=None):
    log_path = log_path or RESPONSES_PATH

    def get_rows():
        if not log_path.exists():
            return []
        with log_path.open() as f:
            print(log_path)
            return [json.loads(line) for line in f.readlines()]

    df = pd.DataFrame(get_rows())
    if len(df) == 0:
        return df, df

    get_latest = lambda group: group.iloc[group.end.argmax()]
    df = df.groupby("id").apply(get_latest).drop(columns=["id"]).reset_index()

    df_flat = []
    for _, response in df.iterrows():
        for i, ans in enumerate(response.answers):
            row = {**response, "index": i, **ans}
            del row["answers"]
            df_flat.append(row)
    df_flat = pd.DataFrame(df_flat)

    return df, df_flat


SAMPLE_SIZE = 4


def sample_next_inventory_problems(log_path=None):
    _, df_flat = load_inventory_responses(log_path)
    qs = load_inventory_questions()

    names = qs.name
    counts = df_flat.question.value_counts().to_dict() if len(df_flat) > 0 else {}
    counts = {**{q: 0 for q in names}, **counts}

    threshold = min(counts.values())
    while True:
        lowest_qs = set([k for k, c in counts.items() if c <= threshold])
        if len(lowest_qs) >= SAMPLE_SIZE:
            break
        else:
            threshold += 1

    return random.sample(list(lowest_qs), k=SAMPLE_SIZE)
