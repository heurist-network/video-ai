"""Small, ranked retrieval over local Gemini references. Python stdlib only."""
import argparse
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB = ROOT / 'library/search.sqlite'

def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for key, child in value.items():
            if key not in ('evidence_frames', 'keyframe_times_s'):
                yield from strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from strings(child)

def build(ordered):
    """Called by report.py with the same ordering as the human catalog."""
    path = DB.with_suffix('.tmp.sqlite')
    path.unlink(missing_ok=True)
    con = sqlite3.connect(path)
    con.execute('CREATE TABLE refs (number INTEGER PRIMARY KEY, id TEXT UNIQUE, data TEXT)')
    con.execute('CREATE VIRTUAL TABLE search USING fts5(title, summary, ideas, fingerprints, tags)')
    for number, source in enumerate(ordered, 1):
        card = source['card']
        catalog = source.get('catalog') or {}
        base = 'library/references/' + source['id'] + '/'
        frames = []
        for i, idea in enumerate(card['ideas'], 1):
            for frame in idea.get('evidence_frames', []):
                frames.append({'idea': i, 'time_s': frame['time_s'], 'path': base + frame['path']})
        record = dict(number=number, reference_id=source['id'], title=catalog.get('title') or card['title'], summary=card['summary'], duration_s=source['duration_s'], collection=catalog.get('batch_id', 'pilot'), tags=catalog.get('tags', []), video=source['source_path'], page='library/pages/' + source['id'] + '.html', card=base+'card.json', frames=frames, review=source.get('review'), spot_check=source.get('ai_spot_check'), ideas=card['ideas'], fingerprints=card['fingerprints'], uncertainties=card.get('uncertainties', []))
        con.execute('INSERT INTO refs VALUES (?,?,?)', (number, source['id'], json.dumps(record)))
        con.execute('INSERT INTO search(rowid,title,summary,ideas,fingerprints,tags) VALUES (?,?,?,?,?,?)', (number, record['title'], record['summary'], ' '.join(strings(card['ideas'])), ' '.join(strings(card['fingerprints'])), ' '.join(record['tags'])))
    con.commit()
    con.close()
    path.replace(DB)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    search = sub.add_parser('search')
    search.add_argument('query')
    search.add_argument('--limit', type=int, default=5)
    search.add_argument('--collection')
    get = sub.add_parser('get')
    get.add_argument('reference', help='Catalog integer or reference ID')
    get.add_argument('--section', choices=['summary','ideas','fingerprints','frames','review','all'], default='summary')
    get.add_argument('--limit', type=int, default=4, help='Maximum evidence images for frames section')
    args = parser.parse_args()
    con = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
    if args.command == 'search':
        terms = re.findall(r'\w+', args.query, re.UNICODE)
        if not terms:
            print('[]'); return
        query = ' OR '.join('"'+term+'"' for term in terms)
        rows = con.execute("SELECT data, snippet(search,-1,'[',']',' … ',24), bm25(search,6,3,2,1,3) FROM search JOIN refs ON refs.number=search.rowid WHERE search MATCH ? ORDER BY bm25(search,6,3,2,1,3), refs.number", (query,))
        result = []
        for data, evidence, score in rows:
            record = json.loads(data)
            if args.collection and record['collection'] != args.collection:
                continue
            result.append({**{k:record[k] for k in ('number','reference_id','title')}, 'summary':record['summary'][:360], 'match':evidence, 'review_status':(record['review'] or {}).get('verdict','pending')})
            if len(result) >= max(1,min(args.limit,20)):
                break
    else:
        row = con.execute('SELECT data FROM refs WHERE id=? OR CAST(number AS TEXT)=?', (args.reference,args.reference)).fetchone()
        if row is None:
            parser.error('Reference not found')
        record = json.loads(row[0])
        result = {k:record[k] for k in ('number','reference_id','title')}
        if args.section == 'all':
            result = record
        elif args.section == 'summary':
            result.update({k:record[k] for k in ('summary','duration_s','video','page','card')})
        elif args.section == 'frames':
            result['frames'] = [{**f, 'absolute_path':str(ROOT/f['path'])} for f in record['frames'][:max(1,min(args.limit,20))]]
        elif args.section == 'review':
            result.update({k:record[k] for k in ('review','spot_check','uncertainties')})
        else:
            result[args.section] = record[args.section]
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
