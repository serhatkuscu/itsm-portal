namespace Itsm.Application.Common;

public sealed record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error NotFound = new("General.NotFound", "The requested resource was not found.");
    public static readonly Error Unauthorized = new("General.Unauthorized", "You are not authorized to perform this action.");

    public static Error Validation(string message) => new("Validation.Error", message);
    public static Error Conflict(string message) => new("Conflict.Error", message);
    public static Error Custom(string code, string message) => new(code, message);
}
