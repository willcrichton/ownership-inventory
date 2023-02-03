import utils
from pathlib import Path

SAMPLE_PATH = (Path(__file__).parent / "sample.log").resolve()


def test_load_inventory_questions():
    qs = utils.load_inventory_questions()
    assert len(qs) == 8


def test_load_inventory_responses():
    log, log_flat = utils.load_inventory_responses(SAMPLE_PATH)
    assert log[log.id == "a"].iloc[0].end == 2
    assert log[log.id == "b"].iloc[0].end == 1
    assert log_flat.question.sort_values().tolist() == [
        "get_or_default",
        "make_separator",
    ]


def test_sample_next_inventory_problems():
    sample = utils.sample_next_inventory_problems(SAMPLE_PATH)
    assert len(sample) == utils.SAMPLE_SIZE

    sampled = set()
    for _ in range(100):
        sampled |= set(utils.sample_next_inventory_problems(SAMPLE_PATH))
    assert "get_or_default" not in sampled
