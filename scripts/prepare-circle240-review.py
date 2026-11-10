"""Validate approved inputs, then create a separate private review derivative package."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import tempfile

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
ROSTER = json.loads((REPO / "docs/council/circle240/intake.json").read_text())
ROOT = "/__circle240_review/"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def derivative(raw):
    with Image.open(io.BytesIO(raw), formats=["PNG"]) as source:
        require(source.size == (1536, 1024), "expected 1536 × 1024 PNG")
        require(getattr(source, "n_frames", 1) == 1, "expected a still PNG")
        source.load()
        # Drop source metadata and preserve the colour profile and all pixels.
        profile = source.info.get("icc_profile")
        pixels = source.convert("RGBA")
        clean = Image.frombytes("RGBA", pixels.size, pixels.tobytes())
        if clean.getextrema()[3] == (255, 255):
            clean = clean.convert("RGB")
        out = io.BytesIO()
        clean.save(out, "PNG", optimize=True, icc_profile=profile)
        result = out.getvalue()
        with Image.open(io.BytesIO(result)) as decoded:
            require(decoded.convert("RGBA").tobytes() == pixels.tobytes(), "derivative changed pixels")
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("drop", type=Path)
    parser.add_argument("--output", type=Path, help="New private directory outside the source checkout")
    parser.add_argument("--private-proof", action="store_true",
                        help="Allow unapproved inputs for loopback review only; retain their approval status")
    args = parser.parse_args()
    drop = args.drop.resolve(strict=True)
    require(not drop.is_relative_to(REPO), "keep masters outside the source checkout")
    evidence = json.loads((drop / "intake.json").read_text())
    known = {c["expectedFiles"][kind] for c in ROSTER for kind in ("front", "reverse", "transcript")}
    require(not (set(evidence) - known), "intake.json includes an unknown filename")
    files, receipt, items = {}, {}, []
    for companion in ROSTER:
        slot = companion["expectedFiles"]
        key = companion["key"]
        assets = {}
        for kind in ("front", "reverse", "transcript"):
            name = slot[kind]
            path = drop / name
            if name not in evidence and not path.exists():
                continue
            require(name in evidence and path.is_file() and not path.is_symlink(), f"{name}: file or review evidence missing")
            record = evidence[name]
            raw = path.read_bytes()
            master_digest = sha(raw)
            require(master_digest == record.get("sha256"), f"{name}: master hash mismatch")
            approved_digest = companion.get("approvedMasterSha256", {}).get(kind)
            require(approved_digest is None or master_digest == approved_digest,
                    f"{name}: does not match the pinned approved master")
            for field in ("creator", "source", "rightsEvidence", "reviewEvidence"):
                require(isinstance(record.get(field), str) and record[field].strip(), f"{name}: {field} missing")
            cleared = record.get("ownerApproved") is True and record.get("publicRightsConfirmed") is True
            require(cleared or args.private_proof, f"{name}: exact master and public rights approval required")
            if kind == "transcript":
                require(raw.decode("utf-8").strip(), f"{name}: blank transcript")
                require("reverse" in assets and record.get("verifiedAgainstReverseSha256") == evidence[slot["reverse"]]["sha256"],
                        f"{name}: requires the exact reviewed reverse in this drop")
                target = f"reverses/{key}.txt"
                output = raw
            else:
                require(isinstance(record.get("alt"), str) and record["alt"].strip(), f"{name}: accessible alt text required")
                target = f"{'portraits' if kind == 'front' else 'reverses'}/{key}.png"
                output = derivative(raw)
            files[target] = output
            receipt[target] = {"master": name, "masterSha256": master_digest, "sha256": sha(output),
                               "bytes": len(output), "publicApprovalRecorded": cleared, "creator": record["creator"], "source": record["source"],
                               "rightsEvidence": record["rightsEvidence"], "reviewEvidence": record["reviewEvidence"]}
            assets[kind] = (target, record, output)
        if len(assets) == 3:
            front, reverse, transcript = [assets[k] for k in ("front", "reverse", "transcript")]
            items.append({"key": key, "id": f"c240-{key}", "label": companion["label"], "kind": companion["role"],
                          "artwork": ROOT + front[0], "alt": front[1]["alt"], "sha256": sha(front[2]),
                          "scientificName": companion.get("scientificName"),
                          "proofPending": any(not receipt[asset[0]]["publicApprovalRecorded"] for asset in assets.values()),
                          "reverse": {"artwork": ROOT + reverse[0], "alt": reverse[1]["alt"], "sha256": sha(reverse[2]),
                                      "transcriptSha256": sha(transcript[2]), "readableText": transcript[2].decode("utf-8"),
                                      "width": 1536, "height": 1024, "privateReview": True}})
    print(f"{len(files)}/30 exact inputs validated. Circle 240 stays inactive.")
    if args.output is None:
        return
    require(len(items) == 10, "a review package requires all ten validated pairs and transcripts")
    output = args.output.resolve()
    require(not output.is_relative_to(REPO) and not output.is_relative_to(drop) and not output.exists(),
            "output must be a new directory outside both the checkout and master drop")
    catalogue = {"number": 240, "status": "PRIVATE_REVIEW", "question": None, "fire": None, "companions": items}
    with tempfile.TemporaryDirectory(dir=output.parent) as tmp:
        package = Path(tmp) / "package"
        package.mkdir()
        for name, data in files.items():
            path = package / name
            path.parent.mkdir(exist_ok=True)
            path.write_bytes(data)
        (package / "catalogue.json").write_text(json.dumps(catalogue, ensure_ascii=False))
        (package / "receipt.private.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2))
        package.rename(output)


if __name__ == "__main__":
    main()
