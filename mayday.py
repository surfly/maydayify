import os
import random
import string
import sqlite3
from opentok import OpenTok
import requests
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash

SURFLY_API = "https://api.surfly.com/v1/session/new"
SURFLY_USER = "<USERNAME>"
SURFLY_PASS = "<PASSWORD>"

OPENTOK_KEY = "<OPENTOKKEY>"
OPENTOK_SECRET = "<OPENTOKSECRET>"

opentok = OpenTok(OPENTOK_KEY, OPENTOK_SECRET)

app = Flask(__name__)

# Load default config and override config from an environment variable
app.config.update(dict(
    DATABASE=os.path.join(app.root_path, 'flask.db'),
    DEBUG=True,
    SECRET_KEY='development key',
    USERNAME='admin',
    PASSWORD='default'
))
app.config.from_envvar('FLASK_SETTINGS', silent=True)


def connect_db():
    """Connects to the specific database."""
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv


def init_db():
    """Initializes the database."""
    db = get_db()
    with app.open_resource('schema.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()


def get_db():
    """Opens a new database connection if there is none yet for the
    current application context.
    """
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db




@app.teardown_appcontext
def close_db(error):
    """Closes the database again at the end of the request."""
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()

@app.route('/')
def index():
    return "Non."
    # For simplicity we assume that the hash never collides
    hash = ''.join(random.choice(string.ascii_letters+string.digits) for i in range(4))
    return render_template("start_session.html", hash=hash)

@app.route('/start/', methods=['GET'])
def session_leader():
    url = request.args.get('url')
    hash = ''.join(random.choice(string.ascii_letters+string.digits) for i in range(4))
    # create Surfly session
    r = requests.post(SURFLY_API, data={'url':url}, auth=(SURFLY_USER, SURFLY_PASS))
    follower = r.json()['viewer_link']
    leader = r.json()['leader_link']
    # create OpenTok session
    session = opentok.create_session()
    session_id = session.session_id
    # store follower url for hash in db
    db = get_db()
    db.execute('insert into sessions (hash, surfly_url, tokbox_session) values (?, ?, ?)', [hash, follower, session_id])
    db.commit()
    # return session template with leader url
    return render_template("session.html", session_url=leader, tokbox_session=session_id, role="leader")

@app.route('/session/<hash>', methods=['GET'])
def session_follower(hash=""):
    db = get_db()
    cur = db.execute('select id, surfly_url, tokbox_session from sessions where hash=?', (hash,))
    result = cur.fetchone()
    follower = result['surfly_url']
    session = result['tokbox_session']
    key = result['id']
    db.execute('delete from sessions where id = ?', (key, ))
    db.commit()
    return render_template('session.html', session_url=follower, tokbox_session=session, role="follower")

@app.route('/stream/<session>', methods=['GET'])
def video_stream(session=""):
    token = opentok.generate_token(session)
    return render_template('videostream.html', apikey=OPENTOK_KEY, session=session, token=token)

@app.route('/dashboard', methods=['GET'])
def show_sessions():
    db = get_db()
    cur = db.execute('select * from sessions where ((strftime("%s","now") - strftime("%s",timestamp)) < 60)')
    sessions = cur.fetchall()
    return render_template('dashboard.html', sessions=sessions)


if __name__ == "__main__":
    with app.app_context():
        init_db()
    #app.debug= True
    app.run()
