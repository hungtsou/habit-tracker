import { Response } from 'express';
import { sendSuccess, sendError } from '../../../src/utils/response';

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('sendSuccess', () => {
  it('sends 200 with { data } wrapper by default', () => {
    const res = mockResponse();
    sendSuccess(res, { id: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: { id: '1' } });
  });

  it('accepts a custom status code', () => {
    const res = mockResponse();
    sendSuccess(res, { id: '1' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('sendError', () => {
  it('sends error with statusCode in body', () => {
    const res = mockResponse();
    sendError(res, 'Not found', 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found', statusCode: 404 });
  });
});
