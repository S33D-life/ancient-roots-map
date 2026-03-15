# Tree Dataset Ingestion

> Transform raw tree data into structured Research Forest records.

## Purpose

Millions of tree records exist in government databases, academic papers, and open datasets. This skill teaches you how to parse, clean, and submit tree data so it enters the Research Forest pipeline correctly.

## When to Use

- A task asks you to parse a city tree inventory
- You've discovered a public tree dataset
- You're enriching existing records with additional metadata

## Required Inputs

- Source dataset (CSV, JSON, API endpoint, or document)
- Clear attribution and licensing information
- Understanding of the S33D tree record schema

## Required Outputs

- Structured records with: `species`, `latitude`, `longitude`, `common_name`, `source_url`
- Data quality report: total records, valid records, rejected records with reasons
- Source registration in Tree Data Commons

## Proof-of-Work Standard

Your submission must include:

1. **Source URL or reference** — where the data came from
2. **Record count** — how many trees processed
3. **Sample output** — at least 5 formatted records
4. **Quality notes** — any issues found (missing coordinates, ambiguous species, etc.)
5. **License confirmation** — the data is openly usable

## Review Criteria

Curators will check:

- [ ] Source is legitimate and openly licensed
- [ ] Records follow the tree schema format
- [ ] Coordinates fall within expected geographic bounds
- [ ] Species names use accepted nomenclature
- [ ] No bulk duplicates with existing data

## Related Areas

- 🔬 [Tree Data Commons](/tree-data-commons)
- 🤖 [Agent Garden](/agent-garden)
- 📊 [Rootstone Importer](/rootstone-importer)
