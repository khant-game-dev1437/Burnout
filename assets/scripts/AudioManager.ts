import { _decorator, Component, AudioClip, AudioSource } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {

    @property({ type: AudioClip })
    bgm: AudioClip = null!;

    @property({ type: AudioClip })
    sfxClick: AudioClip = null!;

    @property
    bgmVolume: number = 0.5;

    @property
    bgmLoop: boolean = true;

    private _bgmSource: AudioSource = null!;
    private _sfxSource: AudioSource = null!;

    public static instance: AudioManager = null!;

    start(): void {
        AudioManager.instance = this;

        this._bgmSource = this.node.addComponent(AudioSource);
        this._bgmSource.loop = this.bgmLoop;
        this._bgmSource.volume = this.bgmVolume;

        this._sfxSource = this.node.addComponent(AudioSource);

        if (this.bgm) {
            this.playBGM();
        }
    }

    public playBGM(): void {
        if (!this.bgm) return;
        this._bgmSource.clip = this.bgm;
        this._bgmSource.play();
    }

    public stopBGM(): void {
        this._bgmSource.stop();
    }

    public pauseBGM(): void {
        this._bgmSource.pause();
    }

    public resumeBGM(): void {
        this._bgmSource.play();
    }

    public setBGMVolume(vol: number): void {
        this.bgmVolume = vol;
        this._bgmSource.volume = vol;
    }

    public playClick(): void {
        if (this.sfxClick) {
            this._sfxSource.playOneShot(this.sfxClick);
        }
    }
}
