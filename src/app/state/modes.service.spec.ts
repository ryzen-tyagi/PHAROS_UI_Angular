import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ModesService } from './modes.service';
import { ModeChannelService } from '../core/mode-channel.service';
import { environment } from '../../environments/environment';

describe('ModesService', () => {
  let service: ModesService;
  let httpMock: HttpTestingController;
  let channelSpy: jasmine.SpyObj<ModeChannelService>;

  beforeEach(() => {
    channelSpy = jasmine.createSpyObj<ModeChannelService>('ModeChannelService', [
      'post',
      'onMessage',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ModeChannelService, useValue: channelSpy },
      ],
    });
    service = TestBed.inject(ModesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetchModes() sets list() from the response', async () => {
    const promise = service.fetchModes();

    const req = httpMock.expectOne(environment.API_BASE + '/v1/modes/get-all-modes');
    expect(req.request.method).toBe('GET');
    req.flush({ modes: [{ id: 1 }, { id: 2 }], message: 'ok' });

    await promise;

    expect(service.list().length).toBe(2);
  });

  it('changeMode() posts, sets current() and calls ModeChannelService.post', async () => {
    const promise = service.changeMode({ mode: 'Live' });

    const req = httpMock.expectOne(environment.API_BASE + '/v1/modes/change-mode');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ mode: 'Live', reason: '', note: '' });
    req.flush({ message: 'changed' });

    await promise;

    expect(service.current()).toBe('Live');
    expect(channelSpy.post).toHaveBeenCalledWith('Live');
  });
});
