namespace Itsm.Application.Common;

public sealed class Result<T>
{
    private Result(T value)
    {
        Value = value;
        IsSuccess = true;
        Error = Error.None;
    }

    private Result(Error error)
    {
        IsSuccess = false;
        Error = error;
        Value = default;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public T? Value { get; }
    public Error Error { get; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);

    public static implicit operator Result<T>(T value) => Success(value);
    public static implicit operator Result<T>(Error error) => Failure(error);
}

public sealed class Result
{
    private Result() { IsSuccess = true; Error = Error.None; }
    private Result(Error error) { IsSuccess = false; Error = error; }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Error Error { get; }

    public static Result Success() => new();
    public static Result Failure(Error error) => new(error);

    public static implicit operator Result(Error error) => Failure(error);
}
